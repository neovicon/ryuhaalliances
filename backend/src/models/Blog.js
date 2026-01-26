import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  userIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  archived: { type: Boolean, default: false },
  reactions: { type: [reactionSchema], default: [] },
  comments: { type: [commentSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Blog', blogSchema);


