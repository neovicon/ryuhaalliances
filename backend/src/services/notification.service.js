import Notification from '../models/Notification.js';

export const createNotification = async ({
    recipient,
    target,
    sender,
    type,
    title,
    message,
    link
}) => {
    try {
        const notification = await Notification.create({
            recipient,
            target,
            sender,
            type,
            title,
            message,
            link
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // We don't want to throw here to avoid breaking the main flow
        return null;
    }
};

export const deleteByLink = async (link) => {
    try {
        await Notification.deleteMany({ link });
    } catch (error) {
        console.error('Error deleting notifications by link:', error);
    }
};
