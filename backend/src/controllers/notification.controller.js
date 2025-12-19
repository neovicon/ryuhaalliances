import Notification from '../models/Notification.js';
import User from '../models/User.js';

export async function getNotifications(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch notifications that are:
        // 1. Targeted to 'all'
        // 2. Targeted to 'admins' (if user is admin)
        // 3. Targeted to 'user' and recipient is current user
        const query = {
            $or: [
                { target: 'all' },
                { target: 'user', recipient: userId }
            ]
        };

        if (userRole === 'admin') {
            query.$or.push({ target: 'admins' });
        }

        const notifications = await Notification.find(query)
            .populate('sender', 'username photoUrl')
            .sort({ createdAt: -1 })
            .limit(50);

        // Add isRead flag for 'all' and 'admins' notifications based on readBy array
        const processedNotifications = notifications.map(n => {
            const obj = n.toObject();
            if (n.target === 'all' || n.target === 'admins') {
                obj.isRead = n.readBy.some(id => String(id) === userId);
            }
            return obj;
        });

        res.json({ notifications: processedNotifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

export async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.target === 'user') {
            if (String(notification.recipient) !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            notification.isRead = true;
        } else {
            // For 'all' or 'admins', add user to readBy if not already there
            if (!notification.readBy.some(id => String(id) === userId)) {
                notification.readBy.push(userId);
            }
        }

        await notification.save();
        res.json({ ok: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
}

export async function markAllAsRead(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Targeted notifications
        await Notification.updateMany(
            { target: 'user', recipient: userId, isRead: false },
            { $set: { isRead: true } }
        );

        // Global notifications
        const globalQuery = {
            $or: [{ target: 'all' }]
        };
        if (userRole === 'admin') {
            globalQuery.$or.push({ target: 'admins' });
        }

        // Add user to readBy for all global notifications they haven't read yet
        await Notification.updateMany(
            { ...globalQuery, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        res.json({ ok: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
}
