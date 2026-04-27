const mongoose = require("mongoose")

//user databse model

const userSchema = new mongoose.Schema({

    email: { type: String, unique: true, lowercase: true, sparse: true, trim: true, default: null },
    phoneNumber: { type: String, unique: true, sparse: true, trim: true, default: null },
    password: {
        type: String, required: function () {
            return !this.googleId
        }
    },
    googleId: { type: String, default: null },
    acceptedTerms: { type: Boolean, default: false },
    // role:{type:String,enum:["admin","approver","user"],default:"user"},

    // store role reference
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },


    //user Profile
    fullName: { type: String, default: null },
    userName: { type: String, unique: true, sparse: true },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Prefer Not Say",null], default: null },

    //account type field describe who is this
    accountType: { type: String, enum: ["user", "employee"], default: "user" },
    //refreshtoken
    refreshTokens: [String],


    //forgot password fields

    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: String, default: null },

    //user blocked field
    isBlocked: { type: Boolean, default: false },

    //userProfile photo
    userPhoto: { type: String, default: null },
    userPhotoPublicId: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, { timestamps: true })


const User = mongoose.model("User", userSchema)
module.exports = User