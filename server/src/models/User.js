import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
  {
    needs: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    wants: {
      type: Number,
      default: 30,
      min: 0,
      max: 100,
    },

    savings: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    isProfileSetupComplete: {
      type: Boolean,
      default: false,
    },

    yearlyBudgets: [
      {
        year: {
          type: Number,
          required: true,
        },

        salary: {
          type: Number,
          required: true,
          min: 0,
        },

        allocation: allocationSchema,
      },
    ],

    categories: [
      {
        name: String,
        color: String,
      },
    ],

    paymentMethods: [
      {
        name: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
