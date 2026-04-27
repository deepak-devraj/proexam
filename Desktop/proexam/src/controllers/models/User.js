const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
 fullName: {
        type: String,
        trim: true,
      },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
      },
    userName: {
        type: String,
        unique: true,
      },
    password: {
        type: String,
        required: true,
      },
  // You can add fields like 'name' or 'dob' here as needed
});

module.exports = mongoose.model('User', userSchema);