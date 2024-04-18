const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// creating a new schema
// A schema is the thing that defines the structure of our documents
// and the model is the thing that surrounds that and provides us
// with the interface for communicating with the db collection  type
const userRequestSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    membershipNo: {
      type: String,
      required: true,
    },
    yearGraduated: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    }
  },
  { timestamps: true }
);

const UserRequest = mongoose.model('UserRequest', userRequestSchema);

module.exports = UserRequest;