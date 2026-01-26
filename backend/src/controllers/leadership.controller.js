import { body, param, validationResult } from 'express-validator';
import LeadershipMember, { leadershipCategories } from '../models/LeadershipMember.js';
import { getPhotoUrl } from '../utils/photoUrl.js';

export const validateCreateMember = [
    body('category').isIn(leadershipCategories).withMessage(`Category must be one of: ${leadershipCategories.join(', ')}`),
    body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('description').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Description is required and must be less than 1000 characters'),
    body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer')
];

export const validateUpdateMember = [
    param('id').isMongoId().withMessage('Valid member ID is required'),
    body('category').optional().isIn(leadershipCategories).withMessage(`Category must be one of: ${leadershipCategories.join(', ')}`),
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('description').optional().isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer')
];

export const validateDeleteMember = [
    param('id').isMongoId().withMessage('Valid member ID is required')
];

// Get all leadership members (public)
export async function listMembers(req, res) {
    try {
        const members = await LeadershipMember.find().sort({ category: 1, order: 1 });

        const membersWithFullUrl = await Promise.all(members.map(async member => {
            const memberObj = member.toObject();
            memberObj.imageUrl = await getPhotoUrl(memberObj.imageUrl, req);
            return memberObj;
        }));

        res.json({ members: membersWithFullUrl });
    } catch (error) {
        console.error('Error fetching leadership members:', error);
        res.status(500).json({ error: 'Failed to fetch leadership members' });
    }
}

// Create new member (admin only)
export async function createMember(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        if (!req.file && !req.files?.image?.[0]) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const imageUrl = req.file ? req.file.storagePath : req.files.image[0].storagePath;
        const { category, name, description, order = 0 } = req.body;

        const member = await LeadershipMember.create({
            category,
            name,
            description,
            imageUrl,
            order: parseInt(order)
        });

        const memberObj = member.toObject();
        memberObj.imageUrl = await getPhotoUrl(memberObj.imageUrl, req);

        res.status(201).json({ member: memberObj, message: 'Leadership member created successfully' });
    } catch (error) {
        console.error('Error creating leadership member:', error);
        res.status(500).json({ error: 'Failed to create leadership member' });
    }
}

// Update member (admin only)
export async function updateMember(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.params;
        const updateData = {};

        if (req.body.category) updateData.category = req.body.category;
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.order !== undefined) updateData.order = parseInt(req.body.order);

        // Handle image update
        if (req.file) {
            updateData.imageUrl = req.file.storagePath;
        } else if (req.files?.image?.[0]) {
            updateData.imageUrl = req.files.image[0].storagePath;
        }

        const member = await LeadershipMember.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!member) {
            return res.status(404).json({ error: 'Leadership member not found' });
        }

        const memberObj = member.toObject();
        memberObj.imageUrl = await getPhotoUrl(memberObj.imageUrl, req);

        res.json({ member: memberObj, message: 'Leadership member updated successfully' });
    } catch (error) {
        console.error('Error updating leadership member:', error);
        res.status(500).json({ error: 'Failed to update leadership member' });
    }
}

// Delete member (admin only)
export async function deleteMember(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.params;
        const member = await LeadershipMember.findByIdAndDelete(id);

        if (!member) {
            return res.status(404).json({ error: 'Leadership member not found' });
        }

        res.json({ message: 'Leadership member deleted successfully' });
    } catch (error) {
        console.error('Error deleting leadership member:', error);
        res.status(500).json({ error: 'Failed to delete leadership member' });
    }
}
