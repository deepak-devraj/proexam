const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  permissions: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model("Role", roleSchema);