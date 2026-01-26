import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { addComment, createPost, listPosts, listPostsByUser, react, removePost, removeComment, validateComment, validateCreatePost, validateDelete, validateReact } from '../controllers/post.controller.js';
import { uploadImage, uploadMedia, uploadToStorage } from '../middleware/upload.js';

const router = Router();
router.get('/user/:identifier', listPostsByUser);
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { getPhotoUrl } = await import('../utils/photoUrl.js');
        const { default: Post } = await import('../models/Post.js');

        const post = await Post.findById(req.params.id)
            .populate('author', 'username photoUrl')
            .populate('comments.author', 'username photoUrl');

        if (!post) return res.status(404).json({ error: 'Post not found' });

        const postObj = post.toObject();
        if (postObj.author && postObj.author.photoUrl) {
            postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
        }
        if (postObj.image) {
            postObj.image = await getPhotoUrl(postObj.image, req);
        }
        if (postObj.video) {
            postObj.video = await getPhotoUrl(postObj.video, req);
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
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});
router.get('/', requireAuth, listPosts);
router.post('/', requireAuth, uploadMedia.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), uploadToStorage, validateCreatePost, createPost);
router.post('/:id/comments', requireAuth, validateComment, addComment);
router.post('/:id/react', requireAuth, validateReact, react);
router.delete('/:id', requireAuth, validateDelete, removePost);
router.delete('/:id/comments/:commentId', requireAuth, removeComment);
export default router;


