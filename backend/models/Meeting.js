import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    // Source email details
    emailId: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      default: 'No Subject',
    },
    from: {
      type: String,
      default: 'Unknown Sender',
    },
    // Calendar event details
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'To be confirmed',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Google Calendar reference
    googleEventId: {
      type: String,
      default: null,
    },
    googleEventLink: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
