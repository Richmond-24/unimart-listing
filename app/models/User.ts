
// app/models/User.ts
import mongoose, { Schema, models } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: false 
    },
    image: { 
      type: String 
    },
    emailVerified: { 
      type: Date 
    },
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  }
);

// Prevent re-compiling the model if it already exists
const User = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;