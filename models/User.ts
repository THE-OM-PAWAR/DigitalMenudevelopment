import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  outletId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  outletId: {
    type: Schema.Types.ObjectId,
    ref: 'Outlet',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent re-compilation during development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);