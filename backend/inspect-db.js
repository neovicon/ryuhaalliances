import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Blog from './src/models/Blog.js';
import Event from './src/models/Event.js';
import Announcement from './src/models/Announcement.js';
import Article from './src/models/Article.js';
import Story from './src/models/Story.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function inspect() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected');

    const models = [
        { name: 'User', model: User, fields: ['photoUrl', 'heroCardUrl', 'warningNotice', 'certificates'] },
        { name: 'Blog', model: Blog, fields: ['imageUrl'] },
        { name: 'Event', model: Event, fields: ['imageUrl'] },
        { name: 'Announcement', model: Announcement, fields: ['imageUrl'] },
        { name: 'Article', model: Article, fields: ['imageUrl'] },
        { name: 'Story', model: Story, fields: ['imageUrl'] }
    ];

    let foundTotal = 0;

    for (const { name, model, fields } of models) {
        for (const field of fields) {
            const query = {};
            query[field] = { $regex: 'http', $options: 'i' };
            const count = await model.countDocuments(query);
            if (count > 0) {
                console.log(`Found ${count} documents in ${name} with HTTP URL in ${field}`);
                const samples = await model.find(query).limit(3);
                samples.forEach(s => console.log(`Sample: ${s[field]}`));
                foundTotal += count;
            }
        }
    }

    if (foundTotal === 0) {
        console.log('No Supabase URLs found in any collection.');
    }

    process.exit(0);
}

inspect();
