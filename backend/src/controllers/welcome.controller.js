import WelcomePost from '../models/WelcomePost.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import blobServiceClient from "../config/azure.js";
import { getUploadPath } from "../utils/storageHelper.js";

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

export const createWelcomePost = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        const filename = req.file.originalname;
        const blobName = getUploadPath(filename);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Ensure container exists
        await containerClient.createIfNotExists({ access: 'container' });

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: {
                blobContentType: req.file.mimetype,
                blobCacheControl: 'public, max-age=31536000'
            }
        });

        const newPost = await WelcomePost.create({
            author: req.user.id,
            image: blobName
        });

        // Populate author to return full info
        await newPost.populate('author', 'username photoUrl');

        const postObj = newPost.toObject();
        postObj.imageUrl = await getPhotoUrl(postObj.image);
        if (postObj.author.photoUrl) {
            postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl);
        }

        res.status(201).json(postObj);
    } catch (error) {
        console.error("Error creating welcome post:", error);
        res.status(500).json({ message: "Failed to create post", error: error.message });
    }
};

export const getWelcomePosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const posts = await WelcomePost.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username photoUrl');

        const processedPosts = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            postObj.imageUrl = await getPhotoUrl(postObj.image);
            if (postObj.author && postObj.author.photoUrl) {
                postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl);
            }
            return postObj;
        }));

        res.status(200).json({
            posts: processedPosts,
            hasMore: processedPosts.length === limit
        });
    } catch (error) {
        console.error("Error fetching welcome posts:", error);
        res.status(500).json({ message: "Failed to fetch posts", error: error.message });
    }
};

export const getRecentWelcomePosts = async (req, res) => {
    try {
        const posts = await WelcomePost.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('author', 'username photoUrl');

        const processedPosts = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            postObj.imageUrl = await getPhotoUrl(postObj.image);
            if (postObj.author && postObj.author.photoUrl) {
                postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl);
            }
            return postObj;
        }));

        res.status(200).json(processedPosts);
    } catch (error) {
        console.error("Error fetching recent welcome posts:", error);
        res.status(500).json({ message: "Failed to fetch recent posts", error: error.message });
    }
};

export const deleteWelcomePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await WelcomePost.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Only admins can delete as per requirement
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Only admins can delete posts" });
        }

        // Delete from Azure (optional but good practice)
        try {
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const blockBlobClient = containerClient.getBlockBlobClient(post.image);
            await blockBlobClient.deleteIfExists();
        } catch (azError) {
            console.warn("Could not delete image from storage:", azError);
        }

        await WelcomePost.findByIdAndDelete(id);
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting welcome post:", error);
        res.status(500).json({ message: "Failed to delete post", error: error.message });
    }
};
