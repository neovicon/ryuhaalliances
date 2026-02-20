import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, UserPlus, Info, FileText, BookOpen, Megaphone, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ type }) => {
    switch (type) {
        case 'blog': return <BookOpen size={16} className="text-blue-500" />;
        case 'announcement': return <Megaphone size={16} className="text-red-500" />;
        case 'article': return <FileText size={16} className="text-green-500" />;
        case 'story': return <Info size={16} className="text-purple-500" />;
        case 'post': return <MessageSquare size={16} className="text-indigo-500" />;
        case 'comment': return <MessageSquare size={16} className="text-gray-500" />;
        case 'signup': return <UserPlus size={16} className="text-yellow-500" />;
        case 'mention_everyone': return <AtSign size={16} className="text-red-600" />;
        case 'dubbing': return <Info size={16} className="text-orange-500" />;
        default: return <Bell size={16} />;
    }
};

const NotificationList = ({ onClose }) => {
    const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();
    const navigate = useNavigate();

    if (loading && notifications.length === 0) {
        return <div className="p-4 text-center">Loading notifications...</div>;
    }

    if (notifications.length === 0) {
        return <div className="p-4 text-center text-gray-500">No notifications yet.</div>;
    }

    return (
        <div className="notification-list-container">
            <div className="notification-header">
                <h3 className="text-lg font-bold">Notifications</h3>
                <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-500 hover:underline"
                >
                    Mark all as read
                </button>
            </div>
            <div className="notification-items max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                    <div
                        key={notification._id}
                        className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                        onClick={() => {
                            markAsRead(notification._id);
                            if (notification.link) navigate(notification.link);
                            if (onClose) onClose();
                        }}
                    >
                        <div className="notification-icon-wrapper">
                            <NotificationIcon type={notification.type} />
                        </div>
                        <div className="notification-content">
                            <div className="notification-title">
                                {notification.title}
                            </div>
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        {!notification.isRead && <div className="unread-dot" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationList;
