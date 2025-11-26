import { getImageUrl } from '../utils/storageUtils.js';

export async function getImage(req, res) {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        const url = await getImageUrl(filename);

        // Redirect to the actual URL or return JSON?
        // User requested: "return res.json({ url: ... })"
        res.json({ url });
    } catch (error) {
        console.error('Error getting image URL:', error);
        res.status(500).json({ error: 'Failed to get image URL' });
    }
}
