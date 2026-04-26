import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  emailId: {
    type: String,
    required: true,
  },
  subject: String,
  from: String,
  originalContent: String,
  aiResult: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['summary', 'reply', 'schedule'],
    required: true,
  },
}, {
  timestamps: true,
});

const Summary = mongoose.model('Summary', summarySchema);

export default Summary;
