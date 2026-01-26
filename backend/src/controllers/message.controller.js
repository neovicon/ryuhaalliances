import Message from '../models/Message.js';
import { getPhotoUrl } from '../utils/photoUrl.js';

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

        const processedMessages = await Promise.all(messages.reverse().map(async (msg) => {
            const msgObj = msg.toObject();
            if (msgObj.sender && msgObj.sender.photoUrl) {
                msgObj.sender.photoUrl = await getPhotoUrl(msgObj.sender.photoUrl, req);
            }
            return msgObj;
        }));

        res.json({
            messages: processedMessages,
            nextCursor
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};
