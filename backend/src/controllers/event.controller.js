import { body, validationResult, param } from 'express-validator';
import Event from '../models/Event.js';
import { getPhotoUrl } from '../utils/photoUrl.js';

export const validateCreateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
];

export async function createEvent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, imageUrl, inactive } = req.body;
    const event = await Event.create({
      title,
      description,
      imageUrl: imageUrl || null,
      inactive: inactive === 'true' || inactive === true,
      createdBy: req.user.id,
      lastEditedBy: req.user.id,
    });

    await event.populate('createdBy', 'username displayName');
    await event.populate('lastEditedBy', 'username displayName');

    const eventObj = event.toObject();
    if (eventObj.imageUrl) {
      eventObj.imageUrl = await getPhotoUrl(eventObj.imageUrl, req);
    }
    const { _id, ...rest } = eventObj;
    res.json({ event: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

export async function listEvents(req, res) {
  try {
    const events = await Event.find()
      .populate('createdBy', 'username displayName')
      .populate('lastEditedBy', 'username displayName')
      .sort({ createdAt: -1 });

    const eventsWithFullUrl = await Promise.all(events.map(async event => {
      const eventObj = event.toObject();
      if (eventObj.imageUrl) {
        eventObj.imageUrl = await getPhotoUrl(eventObj.imageUrl, req);
      }
      const { _id, ...rest } = eventObj;
      return { id: _id, ...rest };
    }));

    res.json({ events: eventsWithFullUrl });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

export const validateUpdateEvent = [
  param('id').isMongoId(),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
];

export async function updateEvent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const { title, description, imageUrl, inactive } = req.body;

    const updateData = { lastEditedBy: req.user.id };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (inactive !== undefined) updateData.inactive = inactive === 'true' || inactive === true;
    // Only update imageUrl if a new image was uploaded (imageUrl is set by middleware)
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    const event = await Event.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'username displayName')
      .populate('lastEditedBy', 'username displayName');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventObj = event.toObject();
    if (eventObj.imageUrl) {
      eventObj.imageUrl = await getPhotoUrl(eventObj.imageUrl, req);
    }
    const { _id, ...rest } = eventObj;
    res.json({ event: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
}

export const validateDeleteEvent = [param('id').isMongoId()];

export async function deleteEvent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

export const validateGetEvent = [param('id').isMongoId().withMessage('Invalid event ID')];

export async function getEventById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate('createdBy', 'username displayName photoUrl')
      .populate('lastEditedBy', 'username displayName')
      .populate('comments.author', 'username displayName photoUrl');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventObj = event.toObject();
    if (eventObj.imageUrl) {
      eventObj.imageUrl = await getPhotoUrl(eventObj.imageUrl, req);
    }
    if (eventObj.createdBy && eventObj.createdBy.photoUrl) {
      eventObj.createdBy.photoUrl = await getPhotoUrl(eventObj.createdBy.photoUrl, req);
    }
    if (eventObj.comments) {
      eventObj.comments = await Promise.all(eventObj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) {
          comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        }
        return comment;
      }));
    }
    const { _id, ...rest } = eventObj;
    res.json({ event: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error fetching event:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid event ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

export const validateAddComment = [
  param('id').isMongoId(),
  body('content').isString().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
];

export async function addComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.comments.push({
      author: req.user.id,
      content: req.body.content,
    });

    await event.save();
    await event.populate('createdBy', 'username displayName photoUrl');
    await event.populate('lastEditedBy', 'username displayName');
    await event.populate('comments.author', 'username displayName photoUrl');

    const eventObj = event.toObject();
    if (eventObj.imageUrl) {
      eventObj.imageUrl = await getPhotoUrl(eventObj.imageUrl, req);
    }
    if (eventObj.createdBy && eventObj.createdBy.photoUrl) {
      eventObj.createdBy.photoUrl = await getPhotoUrl(eventObj.createdBy.photoUrl, req);
    }
    if (eventObj.comments) {
      eventObj.comments = await Promise.all(eventObj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) {
          comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        }
        return comment;
      }));
    }
    const { _id, ...rest } = eventObj;
    res.status(201).json({ event: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

