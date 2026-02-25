import { body, validationResult, param } from 'express-validator';
import GodDomainPost from '../models/GodDomainPost.js';
import House from '../models/House.js';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import * as notificationService from '../services/notification.service.js';

async function ensureUserData(req) {
    if (req.user && req.user.house !== undefined && req.user.memberStatus !== undefined) return;
    const user = await User.findById(req.user.id).select('house memberStatus role');
    if (user) {
        req.user.house = user.house;
        req.user.memberStatus = user.memberStatus;
        req.user.role = user.role;
    }
}

export const validateCreatePost = [
    body('house').isString().notEmpty().withMessage('House is required'),
    body('content')
        .optional()
        .isString()
        .isLength({ max: 10000 })
        .withMessage('Post too long (max 10,000 characters)'),
];

export async function createPost(req, res) {
    await ensureUserData(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { house, content = '' } = req.body;

    // Check if house exists
    const houseDoc = await House.findOne({ name: house });
    if (!houseDoc) return res.status(404).json({ error: 'House not found' });

    // Check if user belongs to the house
    if (req.user.house !== house && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not belong to this house' });
    }

    let image = null;
    if (req.file) {
        image = req.file.storagePath;
    } else if (req.files && req.files.image && req.files.image[0]) {
        image = req.files.image[0].storagePath;
    }

    if (!content.trim() && !image) {
        return res.status(400).json({ error: 'Post must have content or an image' });
    }

    const post = await GodDomainPost.create({
        author: req.user.id,
        house,
        content,
        image
    });

    await post.populate('author', 'username photoUrl house memberStatus');
    const postObj = post.toObject();

    if (postObj.author && postObj.author.photoUrl) {
        postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
    }
    if (postObj.image) {
        postObj.image = await getPhotoUrl(postObj.image, req);
    }

    res.status(201).json({ post: postObj });
}

export async function listPosts(req, res) {
    const { house } = req.params;
    const { cursor, limit = 10 } = req.query;

    const query = { house };
    if (cursor) {
        query._id = { $lt: cursor };
    }

    const posts = await GodDomainPost.find(query)
        .populate('author', 'username photoUrl house memberStatus')
        .populate('comments.author', 'username photoUrl house memberStatus')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    const postsWithFullUrl = await Promise.all(posts.map(async post => {
        const postObj = post.toObject();
        if (postObj.author && postObj.author.photoUrl) {
            postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
        }
        if (postObj.image) {
            postObj.image = await getPhotoUrl(postObj.image, req);
        }
        if (postObj.comments) {
            postObj.comments = await Promise.all(postObj.comments.map(async comment => {
                if (comment.author && comment.author.photoUrl) {
                    comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
                }
                return comment;
            }));
        }
        return postObj;
    }));

    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

    res.json({ posts: postsWithFullUrl, nextCursor });
}

export const validateComment = [
    param('id').isMongoId().withMessage('Invalid post ID'),
    body('content')
        .isString()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters')
];

export async function addComment(req, res) {
    await ensureUserData(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const post = await GodDomainPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check if user belongs to the house
    if (req.user.house !== post.house && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not belong to this house' });
    }

    post.comments.push({ author: req.user.id, content: req.body.content });
    await post.save();

    await post.populate('author', 'username photoUrl house memberStatus');
    await post.populate('comments.author', 'username photoUrl house memberStatus');

    const postObj = post.toObject();
    if (postObj.author && postObj.author.photoUrl) {
        postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
    }
    if (postObj.image) {
        postObj.image = await getPhotoUrl(postObj.image, req);
    }
    if (postObj.comments) {
        postObj.comments = await Promise.all(postObj.comments.map(async comment => {
            if (comment.author && comment.author.photoUrl) {
                comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
            }
            return comment;
        }));
    }

    res.status(201).json({ post: postObj });
}

export async function updatePost(req, res) {
    await ensureUserData(req);
    const post = await GodDomainPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isLord = req.user.memberStatus === 'Lord of the House' && req.user.house === post.house;
    const isAdmin = req.user.role === 'admin';
    const isAuthor = String(post.author) === req.user.id;

    if (!isAuthor && !isLord && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { content } = req.body;
    if (content !== undefined) post.content = content;

    if (req.file) {
        post.image = req.file.storagePath;
    } else if (req.files && req.files.image && req.files.image[0]) {
        post.image = req.files.image[0].storagePath;
    }

    await post.save();
    await post.populate('author', 'username photoUrl house memberStatus');
    await post.populate('comments.author', 'username photoUrl house memberStatus');

    const postObj = post.toObject();
    if (postObj.author && postObj.author.photoUrl) {
        postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
    }
    if (postObj.image) {
        postObj.image = await getPhotoUrl(postObj.image, req);
    }
    if (postObj.comments) {
        postObj.comments = await Promise.all(postObj.comments.map(async comment => {
            if (comment.author && comment.author.photoUrl) {
                comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
            }
            return comment;
        }));
    }

    res.json({ post: postObj });
}

export async function updateComment(req, res) {
    await ensureUserData(req);
    const { id, commentId } = req.params;
    const post = await GodDomainPost.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isLord = req.user.memberStatus === 'Lord of the House' && req.user.house === post.house;
    const isAdmin = req.user.role === 'admin';
    const isAuthor = String(comment.author) === req.user.id;

    if (!isAuthor && !isLord && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { content } = req.body;
    if (content !== undefined) comment.content = content;

    await post.save();
    res.json({ ok: true });
}

export async function removePost(req, res) {
    await ensureUserData(req);
    const post = await GodDomainPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Permission check: author, Lord of the House, or admin
    const isLord = req.user.memberStatus === 'Lord of the House' && req.user.house === post.house;
    const isAdmin = req.user.role === 'admin';
    const isAuthor = String(post.author) === req.user.id;

    if (!isAuthor && !isLord && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    await post.deleteOne();
    res.json({ ok: true });
}

export async function removeComment(req, res) {
    await ensureUserData(req);
    const { id, commentId } = req.params;
    const post = await GodDomainPost.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Permission check: comment author, post author, Lord of the House, or admin
    const isLord = req.user.memberStatus === 'Lord of the House' && req.user.house === post.house;
    const isAdmin = req.user.role === 'admin';
    const isCommentAuthor = String(comment.author) === req.user.id;
    const isPostAuthor = String(post.author) === req.user.id;

    if (!isCommentAuthor && !isPostAuthor && !isLord && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    post.comments.pull(commentId);
    await post.save();

    res.json({ ok: true });
}

export async function updateBlessingPoints(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can edit blessing points' });
    }

    const { houseName, points } = req.body;
    if (typeof points !== 'number') {
        return res.status(400).json({ error: 'Points must be a number' });
    }

    const house = await House.findOneAndUpdate(
        { name: houseName },
        { blessingPoints: points },
        { new: true }
    );

    if (!house) return res.status(404).json({ error: 'House not found' });

    res.json({ house });
}

export async function listHouses(req, res) {
    const houses = await House.find({ status: 'Active' }).sort({ name: 1 });
    res.json({ houses });
}
