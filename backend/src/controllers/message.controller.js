import Message from '../models/Message.js';

export const getMessages = async (req, res) => {
    try {
        const { cursor } = req.query;
        const limit = 20;
        const query = {};

        if (cursor) {
            query._id = { $lt: cursor };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'username photoUrl');

        const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;

        res.json({
            messages: messages.reverse(), // Return in chronological order for the UI
            nextCursor
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};
