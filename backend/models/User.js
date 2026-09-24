import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  picture: String,
  tokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    expiry_date: Number,
  },
  aiCredits: {
    type: Number,
    default: 50,
  },
  creditsResetAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
