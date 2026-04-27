const express = require("express");
const router = express.Router();
const { signupUser, loginUser, logoutUser, forgotpassword, resetPassword } = require("../controllers/authController.js");


router.post("/signup",signupUser);

router.post("/login",loginUser);

router.post("/logout",logoutUser );

router.post("/forgot-password", forgotpassword);
router.post("/reset-password/:uniquePasswordresetToken", resetPassword); // ✅ match controller

module.exports = router;