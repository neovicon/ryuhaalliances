import { body, param, validationResult } from 'express-validator';
import DubbingVideo from '../models/DubbingVideo.js';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import * as notificationService from '../services/notification.service.js';

// Get all dubbing videos (public access)
export async function getAllDubbingVideos(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const videos = await DubbingVideo.find()
            .populate('uploader', 'username displayName photoUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalVideos = await DubbingVideo.countDocuments();
        const totalPages = Math.ceil(totalVideos / limit);

        const videosWithUrls = await Promise.all(videos.map(async video => {
            const videoObj = video.toObject();
            videoObj.videoUrl = await getPhotoUrl(videoObj.videoUrl, req);
            videoObj.thumbnailUrl = await getPhotoUrl(videoObj.thumbnailUrl, req);
            if (videoObj.uploader?.photoUrl) {
                videoObj.uploader.photoUrl = await getPhotoUrl(videoObj.uploader.photoUrl, req);
            }
            const { _id, ...rest } = videoObj;
            return { id: _id, ...rest };
        }));

        res.json({
            videos: videosWithUrls,
            pagination: {
                page,
                limit,
                totalVideos,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching dubbing videos:', error);
        res.status(500).json({ error: 'Failed to fetch dubbing videos' });
    }
}

// Get single dubbing video (public access)
export async function getDubbingVideo(req, res) {
    try {
        const { id } = req.params;
        const video = await DubbingVideo.findById(id)
            .populate('uploader', 'username displayName photoUrl')
            .populate('comments.user', 'username displayName photoUrl')
            .populate('reactions.user', 'username displayName photoUrl');

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Increment view count
        video.views += 1;
        await video.save();

        const videoObj = video.toObject();
        videoObj.videoUrl = await getPhotoUrl(videoObj.videoUrl, req);
        videoObj.thumbnailUrl = await getPhotoUrl(videoObj.thumbnailUrl, req);
        if (videoObj.uploader?.photoUrl) {
            videoObj.uploader.photoUrl = await getPhotoUrl(videoObj.uploader.photoUrl, req);
        }
        // Process comments
        if (videoObj.comments) {
            videoObj.comments = await Promise.all(videoObj.comments.map(async comment => {
                if (comment.user?.photoUrl) {
                    comment.user.photoUrl = await getPhotoUrl(comment.user.photoUrl, req);
                }
                return comment;
            }));
        }
        // Process reactions
        if (videoObj.reactions) {
            videoObj.reactions = await Promise.all(videoObj.reactions.map(async reaction => {
                if (reaction.user?.photoUrl) {
                    reaction.user.photoUrl = await getPhotoUrl(reaction.user.photoUrl, req);
                }
                return reaction;
            }));
        }

        const { _id, ...rest } = videoObj;
        res.json({ video: { id: _id, ...rest } });
    } catch (error) {
        console.error('Error fetching dubbing video:', error);
        res.status(500).json({ error: 'Failed to fetch dubbing video' });
    }
}

export const validateCreateDubbingVideo = [
    body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be 2000 characters or less'),
    body('videoUrl').notEmpty().withMessage('Video URL is required'),
    body('thumbnailUrl').optional().isString(),
];

// Create dubbing video (dubbers only)
export async function createDubbingVideo(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findById(req.user.id);
        if (!user.isDubber && user.role !== 'admin') {
            return res.status(403).json({ error: 'Only dubbers can upload videos' });
        }

        const { title, description, videoUrl, thumbnailUrl } = req.body;
        const video = await DubbingVideo.create({
            title,
            description,
            videoUrl,
            thumbnailUrl,
            uploader: req.user.id
        });

        const populatedVideo = await DubbingVideo.findById(video._id)
            .populate('uploader', 'username displayName photoUrl');

        const videoObj = populatedVideo.toObject();
        videoObj.videoUrl = await getPhotoUrl(videoObj.videoUrl, req);
        videoObj.thumbnailUrl = await getPhotoUrl(videoObj.thumbnailUrl, req);
        if (videoObj.uploader?.photoUrl) {
            videoObj.uploader.photoUrl = await getPhotoUrl(videoObj.uploader.photoUrl, req);
        }

        const { _id, ...rest } = videoObj;

        // Create notification
        notificationService.createNotification({
            target: 'all',
            sender: req.user.id,
            type: 'dubbing',
            title: 'New VA Video',
            message: `${req.user.username} uploaded a new VA video: ${title}`,
            link: `/dubbing/${_id}`
        });

        res.status(201).json({ video: { id: _id, ...rest }, message: 'Video uploaded successfully' });
    } catch (error) {
        console.error('Error creating dubbing video:', error);
        res.status(500).json({ error: 'Failed to create dubbing video' });
    }
}

export const validateAddReaction = [
    param('id').isMongoId().withMessage('Valid video ID is required'),
    body('type').isIn(['like', 'love', 'fire', 'clap', 'laugh']).withMessage('Valid reaction type is required'),
];

// Add reaction to video (authenticated users only)
export async function addReaction(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { id } = req.params;
        const { type } = req.body;
        const video = await DubbingVideo.findById(id);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Remove existing reaction from this user if any
        video.reactions = video.reactions.filter(r => String(r.user) !== String(req.user.id));

        // Add new reaction
        video.reactions.push({ user: req.user.id, type });
        await video.save();

        res.json({ message: 'Reaction added successfully' });
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'Failed to add reaction' });
    }
}

export const validateRemoveReaction = [
    param('id').isMongoId().withMessage('Valid video ID is required'),
];

// Remove reaction from video (authenticated users only)
export async function removeReaction(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { id } = req.params;
        const video = await DubbingVideo.findById(id);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        video.reactions = video.reactions.filter(r => String(r.user) !== String(req.user.id));
        await video.save();

        res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ error: 'Failed to remove reaction' });
    }
}

export const validateAddComment = [
    param('id').isMongoId().withMessage('Valid video ID is required'),
    body('content').notEmpty().withMessage('Comment content is required').isLength({ max: 1000 }).withMessage('Comment must be 1000 characters or less'),
];

// Add comment to video (authenticated users only)
export async function addComment(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { id } = req.params;
        const { content } = req.body;
        const video = await DubbingVideo.findById(id);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        video.comments.push({ user: req.user.id, content });
        await video.save();

        const populatedVideo = await DubbingVideo.findById(id)
            .populate('comments.user', 'username displayName photoUrl');

        const lastComment = populatedVideo.comments[populatedVideo.comments.length - 1];
        const commentObj = lastComment.toObject();
        if (commentObj.user?.photoUrl) {
            commentObj.user.photoUrl = await getPhotoUrl(commentObj.user.photoUrl, req);
        }

        // Create notification
        notificationService.createNotification({
            target: 'all',
            sender: req.user.id,
            type: 'comment',
            title: 'New Comment on VA Video',
            message: `${req.user.username} commented on the VA video: ${video.title}`,
            link: `/dubbing/${id}`
        });

        res.json({ comment: commentObj, message: 'Comment added successfully' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
}

export const validateDeleteComment = [
    param('id').isMongoId().withMessage('Valid video ID is required'),
    param('commentId').isMongoId().withMessage('Valid comment ID is required'),
];

// Delete comment from video (comment owner or admin only)
export async function deleteComment(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { id, commentId } = req.params;
        const video = await DubbingVideo.findById(id);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const comment = video.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const user = await User.findById(req.user.id);
        if (String(comment.user) !== String(req.user.id) && user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        video.comments.pull(commentId);
        await video.save();

        // Delete associated notifications
        notificationService.deleteByLink(`/dubbing/${id}`);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
}

// Increment share count
export async function incrementShareCount(req, res) {
    try {
        const { id } = req.params;
        const video = await DubbingVideo.findByIdAndUpdate(
            id,
            { $inc: { shareCount: 1 } },
            { new: true }
        );

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        res.json({ message: 'Share count incremented' });
    } catch (error) {
        console.error('Error incrementing share count:', error);
        res.status(500).json({ error: 'Failed to increment share count' });
    }
}

// Delete dubbing video (uploader or admin only)
export async function deleteDubbingVideo(req, res) {
    try {
        const { id } = req.params;
        const video = await DubbingVideo.findById(id);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const user = await User.findById(req.user.id);
        if (String(video.uploader) !== String(req.user.id) && user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own videos' });
        }

        await video.deleteOne();

        // Delete associated notifications
        notificationService.deleteByLink(`/dubbing/${id}`);

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting dubbing video:', error);
        res.status(500).json({ error: 'Failed to delete dubbing video' });
    }
}
