const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const taskSchema = new Schema({
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;