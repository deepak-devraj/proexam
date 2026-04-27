const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {type: String, trim: true, required: true, unique: true, lowercase: true},
    permissions: {
        type: Map,
        of: {
            type: String,
            enum: ["none", "view", "edit", "delete"],
            default: "none"
        }
    },

    isDeleted: { type: Boolean, default: false},
    deletedAt: { type: Date, default: false},

    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    deletedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
}, {timestamps: true})


const Role = mongoose.model("Role", roleSchema);
module.exports = Role;