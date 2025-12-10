import EventEntry from '../models/EventEntry.js';
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
            uploader: req.user._id,
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
        const { eventId } = req.query;
        const filter = eventId ? { event: eventId } : {};

        const entries = await EventEntry.find(filter)
            .populate('uploader', 'username')
            .populate('comments.user', 'username photoUrl')
            .sort({ createdAt: -1 });

        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch entries", error: error.message });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, isVisitor } = req.body;

        const entry = await EventEntry.findById(id);
        if (!entry) return res.status(404).json({ message: "Entry not found" });

        if (isVisitor) {
            // Visitor reaction
            if (!['heart', 'laugh', 'thumbsUp'].includes(type)) {
                return res.status(400).json({ message: "Invalid visitor reaction type" });
            }
            entry.visitorReactions[type] = (entry.visitorReactions[type] || 0) + 1;
        } else {
            // Registered user reaction
            if (!req.user) return res.status(401).json({ message: "Unauthorized" });

            const existingReactionIndex = entry.reactions.findIndex(r => r.user.toString() === req.user._id.toString());

            if (existingReactionIndex > -1) {
                // Update or remove if same? Let's just update or toggle.
                // If same type, remove it (toggle off). If different, update it.
                if (entry.reactions[existingReactionIndex].type === type) {
                    entry.reactions.splice(existingReactionIndex, 1);
                } else {
                    entry.reactions[existingReactionIndex].type = type;
                }
            } else {
                entry.reactions.push({ user: req.user._id, type });
            }
        }

        await entry.save();
        res.status(200).json(entry);
    } catch (error) {
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
            user: req.user._id,
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
