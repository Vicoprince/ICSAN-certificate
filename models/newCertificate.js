const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// creating a new schema
// A schema is the thing that defines the structure of our documents
// and the model is the thing that surrounds that and provides us
// with the interface for communicating with the db collection  type
const newCertificateSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Graduate", "Associate", "Fellow"],
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    registrationNo: {
      type: String,
      required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Collected"],
        default: "Pending",
    }
  },
  { timestamps: true }
);

const NewCertificate = mongoose.model("newCertificate", newCertificateSchema);

module.exports = NewCertificate;
