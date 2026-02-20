import EventEntry from '../models/EventEntry.js';
import Reaction from '../models/Reaction.js';
import { nanoid } from 'nanoid';
import { getUploadPath } from '../utils/storageHelper.js';
import blobServiceClient from '../config/azure.js';

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

export const createEntry = async (req, res) => {
    try {
        const { eventId, memberName, description, mediaType } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No media file uploaded" });
        }

        const filename = req.file.originalname;
        const blobName = getUploadPath(filename);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({ access: 'container' });
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: {
                blobContentType: req.file.mimetype,
                blobCacheControl: 'public, max-age=31536000'
            }
        });

        // Construct public URL (assuming public access is enabled as per upload controller)
        // If using SAS tokens for everything, we might store just the blobName. 
        // But existing upload controller returns 'key' (blobName). 
        // Let's store the full URL or just the key? 
        // The existing DubbingVideo model stores 'videoUrl' and 'thumbnailUrl'.
        // Let's store the full URL for simplicity if public access is on, or just the key if we need to sign it every time.
        // Given the upload controller has a 'getSignedUrlForFile', it suggests private access or SAS requirement.
        // However, the upload controller also sets 'access: container' which implies public read.
        // Let's store the blobName as 'mediaUrl' effectively, or the full URL if we can construct it.
        // Actually, let's stick to the pattern in `upload.controller.js` which returns the key.
        // But `DubbingVideo` seems to expect a URL. 
        // Let's store the full URL if possible, or just the key. 
        // For now, I will store the blobName and we can generate the URL on the frontend or use the signed URL endpoint if needed.
        // Wait, `DubbingVideo` has `videoUrl`. Let's see how it's used.
        // I'll assume we can store the blobName and the frontend knows how to fetch it, OR I can construct the URL here.
        // `blockBlobClient.url` gives the URL.

        const mediaUrl = blockBlobClient.url;

        const entry = new EventEntry({
            event: eventId,
            uploader: req.user.id,
            memberName,
            description,
            mediaUrl: mediaUrl, // Storing the direct URL
            mediaType, // 'image' or 'video'
        });

        await entry.save();
        res.status(201).json(entry);
    } catch (error) {
        console.error("Error creating entry:", error);
        res.status(500).json({ message: "Failed to create entry", error: error.message });
    }
};

export const getEntries = async (req, res) => {
    try {
        const { eventId, trending } = req.query;
        const filter = eventId ? { event: eventId } : {};

        let query = EventEntry.find(filter)
            .populate('uploader', 'username')
            .populate('event', 'title inactive') // Populating title
            .populate('comments.user', 'username photoUrl');

        if (!trending) {
            query = query.sort({ createdAt: -1 });
        }

        const entries = await query;

        // Get guestId/userId for the current user
        const userId = req.user?.id;
        const guestId = req.cookies['guest-id'];
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Fetch user's reactions for these entries
        let userReactions = [];
        const entryIds = entries.map(e => e._id);

        if (userId || guestId) {
            let reactionQuery = { itemId: { $in: entryIds }, itemModel: 'EventEntry' };
            if (userId) reactionQuery.userId = userId;
            else reactionQuery.guestId = guestId;
            userReactions = await Reaction.find(reactionQuery);
        } else {
            // Fallback to IP if no identifiers
            userReactions = await Reaction.find({ itemId: { $in: entryIds }, itemModel: 'EventEntry', ip });
        }

        // Fetch total counts for these entries
        const allCounts = await Reaction.aggregate([
            { $match: { itemId: { $in: entryIds }, itemModel: 'EventEntry' } },
            { $group: { _id: { itemId: '$itemId', type: '$type' }, count: { $sum: 1 } } }
        ]);

        const reactionCountsMap = allCounts.reduce((acc, curr) => {
            const { itemId, type } = curr._id;
            const idStr = itemId.toString();
            if (!acc[idStr]) acc[idStr] = {};
            acc[idStr][type] = curr.count;
            return acc;
        }, {});

        let entriesWithUserReaction = entries.map(entry => {
            const reaction = userReactions.find(r => r.itemId.toString() === entry._id.toString());
            const counts = reactionCountsMap[entry._id.toString()] || {};
            const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
            const totalComments = entry.comments?.length || 0;

            return {
                ...entry.toObject(),
                userActiveReaction: reaction ? reaction.type : null,
                reactionCounts: counts,
                engagementScore: totalReactions + totalComments // Simple score for sorting
            };
        });

        if (trending) {
            entriesWithUserReaction.sort((a, b) => b.engagementScore - a.engagementScore);
            if (req.query.limit) {
                entriesWithUserReaction = entriesWithUserReaction.slice(0, parseInt(req.query.limit));
            }
        }

        res.status(200).json(entriesWithUserReaction);
    } catch (error) {
        console.error('getEntries error:', error);
        res.status(500).json({ message: "Failed to fetch entries", error: error.message });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        let userId = req.user?.id;
        let guestId = req.cookies['guest-id'];

        // If not logged in and no guest cookie, create one
        if (!userId && !guestId) {
            guestId = nanoid();
            res.cookie('guest-id', guestId, {
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        }

        const entry = await EventEntry.findById(id);
        if (!entry) return res.status(404).json({ message: "Entry not found" });

        // Criteria for finding existing reaction
        let query = { itemId: id, itemModel: 'EventEntry' };
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            query.ip = ip;
        }

        const existingReaction = await Reaction.findOne(query);

        if (existingReaction) {
            if (existingReaction.type === type) {
                // Same emoji — toggle off
                await Reaction.deleteOne({ _id: existingReaction._id });

                // Decrement counter if it exists in visitorReactions
                if (['heart', 'laugh', 'thumbsUp'].includes(type)) {
                    await EventEntry.findByIdAndUpdate(id, { $inc: { [`visitorReactions.${type}`]: -1 } });
                }
            } else {
                // Different emoji — update
                const oldType = existingReaction.type;
                existingReaction.type = type;
                await existingReaction.save();

                // Update counters if applicable
                const updates = {};
                if (['heart', 'laugh', 'thumbsUp'].includes(oldType)) updates[`visitorReactions.${oldType}`] = -1;
                if (['heart', 'laugh', 'thumbsUp'].includes(type)) updates[`visitorReactions.${type}`] = 1;

                if (Object.keys(updates).length > 0) {
                    await EventEntry.findByIdAndUpdate(id, { $inc: updates });
                }
            }
        } else {
            // New reaction
            await Reaction.create({
                itemId: id,
                itemModel: 'EventEntry',
                userId,
                guestId,
                ip,
                type
            });

            // Increment counter if applicable
            if (['heart', 'laugh', 'thumbsUp'].includes(type)) {
                await EventEntry.findByIdAndUpdate(id, { $inc: { [`visitorReactions.${type}`]: 1 } });
            }
        }

        // Return updated entry (including populated fields if needed, or just the entry)
        // For simplicity, re-fetch and populate
        const updatedEntry = await EventEntry.findById(id)
            .populate('uploader', 'username')
            .populate('comments.user', 'username photoUrl');

        res.status(200).json(updatedEntry);
    } catch (error) {
        console.error('addReaction error:', error);
        res.status(500).json({ message: "Failed to add reaction", error: error.message });
    }
};


export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) return res.status(400).json({ message: "Comment content required" });

        const entry = await EventEntry.findById(id);
        if (!entry) return res.status(404).json({ message: "Entry not found" });

        entry.comments.push({
            user: req.user.id,
            content
        });

        await entry.save();

        // Re-fetch to populate user details for the new comment
        const updatedEntry = await EventEntry.findById(id).populate('comments.user', 'username photoUrl');

        res.status(200).json(updatedEntry);
    } catch (error) {
        res.status(500).json({ message: "Failed to add comment", error: error.message });
    }
};

export const deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await EventEntry.findByIdAndDelete(id);
        if (!entry) return res.status(404).json({ message: "Entry not found" });
        res.status(200).json({ message: "Entry deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete entry", error: error.message });
    }
};

export const updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberName, description } = req.body;

        const entry = await EventEntry.findById(id);
        if (!entry) return res.status(404).json({ message: "Entry not found" });

        if (memberName) entry.memberName = memberName;
        if (description) entry.description = description;

        await entry.save();
        res.status(200).json(entry);
    } catch (error) {
        res.status(500).json({ message: "Failed to update entry", error: error.message });
    }
};
