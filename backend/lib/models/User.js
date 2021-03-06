const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const {
  defaultPrefs,
  schema: notifyPreferenceSchema,
} = require("./NotifyPreference");
// const { schema: locationSchema } = require("./Location");
const { isValidEmail } = require("../utils");

const userSchema = new Schema(
  {
    about: { maxLength: 100, trim: true, type: String },
    email: {
      required: true,
      type: String,
      unique: true,
      uniqueCaseInsensitive: true,
      validator: isValidEmail,
    },
    notifyPrefs: {
      default: defaultPrefs(),
      type: notifyPreferenceSchema,
    },
    location: Object,
    photo: String,
    verification: Object,
  },
  { collection: "users", timestamps: true },
);

// indices keys aren't meant to be sorted alphabetically. Please don't change
// the keys' order unless you really intend to change indexing
/* eslint-disable sort-keys */
userSchema.index({ "location.coordinates": "2dsphere" });

userSchema.index({
  type: 1,
  ownerId: 1,
  createdAt: -1,
});

userSchema.index(
  {
    name: "text",
    firstName: "text",
    lastName: "text",
    about: "text",
    "location.country": "text",
    "location.state": "text",
    "location.city": "text",
  },
  {
    default_language: "none",
    language_override: "dummy",
    weights: {
      name: 2,
      firstName: 2,
      lastName: 2,
      about: 1,
      "location.country": 1,
      "location.state": 1,
      "location.city": 1,
    },
  },
);

/* eslint-enable */

// Apply the uniqueValidator plugin to userSchema.
userSchema.plugin(uniqueValidator);

const User = model("User", userSchema);

exports.schema = userSchema;
exports.model = User;
