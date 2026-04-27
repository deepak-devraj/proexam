const User = require("./authModel"); // Corrected path for this folder
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const resend = new Resend(process.env.RESEND_API_KEY|| '');
const { Resend } = require("resend");

// ADD THIS LINE BELOW
const userService = require("../services/authService");
// Helper for password strength (reusable)
const passwordOptions = {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
};

const signupUser = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;

        // 1. Check required fields
        if (!email || !password || !fullName || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Full Name, Email, Password, and Confirm Password are required.",
            });
        }

        // 2. Confirm Password Match (Controller Level Check)
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false, // Changed to false for consistency
                message: "Passwords do not match.",
            });
        }

        // 3. Validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format." });
        }

        // 4. Validate strength
        if (!validator.isStrongPassword(password, passwordOptions)) {
            return res.status(400).json({
                success: false,
                message: "Password must be 8+ chars with uppercase, lowercase, number, and symbol.",
            });
        }

        // UPDATED: Now passing confirmPassword to the service
        const newUser = await userService.createUser(fullName, email, password, confirmPassword);

        res.status(201).json({
            success: true,
            message: "User registered successfully!",
            data: {
                fullName: newUser.fullName,
                userId: newUser._id,
                email: newUser.email,
                userName: newUser.userName,
            },
        });
    } catch (err) {
        console.error("Signup error:", err.message);
        res.status(err.message === "User already exists" ? 400 : 500).json({
            success: false,
            message: err.message || "Internal server error.",
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const user = await userService.checkPassword(email, password);
        const filmyJWTToken = generateJWTToken(user);

        res.cookie("filmyJWTToken", filmyJWTToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "User Login successfully!",
            data: { fullName: user.fullName, email: user.email, userName: user.userName },
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Something Went Wrong",
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        res.clearCookie("filmyJWTToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            path: "/",
        });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server error during logout" });
    }
};

const forgotpassword = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ success: false, message: "Email or Phone is required" });
        }

        let emailcheck = validator.isEmail(identifier);
        let user;

        if (emailcheck) {
            user = await User.findOne({ email: identifier });
            if (!user) {
                return res.status(404).json({ success: false, message: "Account not found with this email." });
            }

            const uniqueToken = crypto.randomBytes(32).toString("hex");
            user.resetToken = uniqueToken;
            user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
            await user.save();

            const resetLinkPassword = `https://filmydock-frontend.onrender.com/change-password/${uniqueToken}`;

            await resend.emails.send({
                from: `filmy dock <${process.env.RESEND_DOMAIN}>`,
                to: user.email,
                subject: "Password Reset Link",
                html: `<p>Click <a href="${resetLinkPassword}">here</a> to reset your password. Link expires in 15 mins.</p>`
            });

            return res.status(200).json({ success: true, message: "Password reset link sent to email" });

        } else if (/^\+[1-9]\d{6,14}$/.test(identifier)) {
            user = await User.findOne({ phoneNumber: identifier });
            if (!user) return res.status(404).json({ message: "Phone number not found" });
            return res.status(200).json({ message: "User exists, proceed with OTP" });
        } else {
            return res.status(400).json({ message: "Invalid format. Use +91... or email." });
        }
    } catch (e) {
        console.error("Forgot Password Error:", e.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: e.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { uniquePasswordresetToken } = req.params;
        const { newPassword, newConfirmPassword } = req.body;

        if (newPassword !== newConfirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        const user = await User.findOne({
            resetToken: uniquePasswordresetToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token." });
        }

        user.password = newPassword; // Model pre-save hook will handle hashing
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        return res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (e) {
        return res.status(500).json({ success: false, message: "Reset error", error: e.message });
    }
};

module.exports = { signupUser, loginUser, logoutUser, forgotpassword, resetPassword };