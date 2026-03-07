const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, lowercase: true, sparse: true, trim: true },
    phoneNumber: { type: String, unique: true, sparse: true, trim: true },
    password: {
        type: String, 
        required: function () {
            return !this.googleId; // Password only required if not using Google Auth
        }
    },
    googleId: { type: String, default: null },
    acceptedTerms: { type: Boolean, default: false },
    
    // store role reference
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },

    // user Profile
    fullName: { type: String, default: null },
    userName: { type: String, unique: true, sparse: true, default: null },
    dob: { type: Date, default: null },
    gender: { 
        type: String, 
        enum: ["Male", "Female", "Prefer Not to Say"], 
        default: null 
    },

    // account type field
    accountType: { type: String, enum: ["user", "employee"], default: "user" },
    
    // tokens
    refreshTokens: [String],

    // forgot password fields - FIXED: resetTokenExpiry changed to Date
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },

    // user status fields
    isBlocked: { type: Boolean, default: false },

    // user Profile photo
    userPhoto: { type: String, default: null },
    userPhotoPublicId: { type: String, default: null },
    
    // soft delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

/**
 * Pre-save hook to hash password automatically
 * This ensures that whenever a user is created or password is updated, 
 * it gets hashed using bcrypt before hitting the database.
 */
userSchema.pre("save", async function (next) {
    // ONLY hash the password if it has been modified (signup or password reset)
    if (!this.isModified("password")) return next(); 

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;