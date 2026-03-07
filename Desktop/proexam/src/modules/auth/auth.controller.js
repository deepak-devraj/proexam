const User = require("./auth.model")
const hashedPassword = require("../../utils/hashesPassword")
const verifyGoogle = require("../../utils/verifyGoogle")
const bcrypt = require("bcrypt")
const validator = require("validator")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const Role = require("../../rolepermission/rolepermission.model")
const { generateaccessToken, generaterefreshToken } = require("../../utils/token")
const jwt = require("jsonwebtoken")
// const resend = new Resend(process.env.RESEND_API_KEY)

//user registration route
const registerUser = async (req, res) => {
    try {
        const { identifier, password, confirmpassword, acceptedTerms } = req.body


        // basic field checking 
        if (!identifier || !password || !confirmpassword) {
            return res.status(400).json({ message: "All fields are required" })
        }

        if (password !== confirmpassword) return res.status(400).json({ message: "Passwords do not match. Try again." });
        // terms acceptance check
        if (acceptedTerms !== true) {
            return res.status(400).json({ message: "You must accept terms and conditions" })
        }
        //check if identifier is phone or email
        let userData = {}
        let emailvalidchecking = validator.isEmail(identifier)
        let phonenumbervalidchecking = /^\+[1-9]\d{6,14}$/.test(identifier)

        if (emailvalidchecking) {
            userData.email = identifier

        } else if (phonenumbervalidchecking) {

            userData.phoneNumber = identifier
        } else {
            return res.status(400).json({ message: "Enter a valid email" })
        }

        if (!userData.email && !userData.phoneNumber) {
            return res.status(400).json({ message: "Enter a valid email" })
        }
        //strong password validation
        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({ message: "Passwords do not match criteria. Try again." })
        }
        //checking existing user

        const query = userData.email ? { email: userData.email } : { phoneNumber: userData.phoneNumber }
        const existingUser = await User.findOne(query)
        if (existingUser) return res.status(400).json({ message: "User Already exists" })

        //find role "user"
        let userRole = await Role.findOne({ name: "user" })

        // if not exists → create default user role
        if (!userRole) {
            userRole = await Role.create({
                name: "user",
                permissions:{}
            })
        }

        //hashing password and storing user in db
        const hashed = await hashedPassword(password)  //creating hashed password

        const finalUser = {password: hashed, acceptedTerms: acceptedTerms, role: userRole._id }
        if(userData.email) finalUser.email=userData.email
        if(userData.phoneNumber) finalUser.phoneNumber=userData.phoneNumber
        const user=await User.create(finalUser)
        if (!user) return res.status(500).json({ message: "Failed to create user" })

        //populate role
        const createdUser = await User.findById(user._id).populate("role")

        //generating jwt token
        const userPayload = { id: user._id, role: createdUser.role.name }
        const accessToken = generateaccessToken(userPayload)
        const refreshToken = generaterefreshToken(userPayload)

        user.refreshTokens.push(refreshToken)
        await user.save()
        //sending token via cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000

        })

        return res.status(201).json({ accessToken, message: "User registered Successfully" })  //generating token
    } catch (e) {
        return res.status(500).json({ message: "User register failed", error: e.message })
    }
};

//user login route
const loginUser = async (req, res) => {
    try {
        const { identifier, password, rememberMe = false } = req.body

        //validate inputs
        if (!identifier || !password) {
            return res.status(400).json({ message: "All fields are Required" })
        }

        //check if identifier is phone or email
        let userquery = {}

        let emailvalidchecking = validator.isEmail(identifier)
        let phonenumbervalidchecking = /^\+[1-9]\d{6,14}$/.test(identifier)

        if (emailvalidchecking) {
            userquery.email = identifier

        } else if (phonenumbervalidchecking) {
            userquery.phoneNumber = identifier
        } else {
            return res.status(400).json({ message: "Enter a valid email or phone number in international format e.g., +919876543210" })
        }

        //finding user

        const existingUser = await User.findOne(userquery).populate("role")
        if (!existingUser) return res.status(400).json({ message: "Email id/Phone number doesn’t exist" })

        //compare password
        const isMatch = await bcrypt.compare(password, existingUser.password)   //comparing password
        if (!isMatch) return res.status(400).json({ message: "Password you entered is incorrect. Please try again." })
        //generating jwt token 
        const userPayload = { id: existingUser._id, role: existingUser.role.name }
        const accessToken = generateaccessToken(userPayload)
        const refreshToken = generaterefreshToken(userPayload, rememberMe)

        existingUser.refreshTokens.push(refreshToken)
        await existingUser.save()
        //sending token via cookies
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000

        })

        return res.status(200).json({ accessToken, message: "Login Successful" })   //generating jwt token
    } catch (e) {
        return res.status(500).json({ message: "Login Failed", error: e.message })
    }
}

// Refresh Token Route
const refreshtoken = async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" })
        // Find user having this refresh token
        const user = await User.findOne({ refreshTokens: refreshToken }).populate("role")
        if (!user) return res.status(403).json({ message: "Invalid refresh token" })
        //verify the user token
        const decode = jwt.verify(refreshToken, process.env.REFRESH_SECRET)
        const rememberMe = decode.rememberMe
        // Check if the token belongs to the user
        if (decode.id !== user._id.toString()) {
            return res.status(403).json({ message: "Invalid refresh token" })
        }
        //removing old token from db
        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken)
        // generate new tokens
        const newRefreshToken = generaterefreshToken({ id: user._id, role: user.role.name }, rememberMe)
        const newAccessToken = generateaccessToken({ id: user._id, role: user.role.name })
        user.refreshTokens.push(newRefreshToken)
        await user.save()
        // Send new refresh token in cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        })
        return res.json({ accessToken: newAccessToken })
    } catch (e) {
        return res.status(403).json({ message: "Invalid refresh token" })
    }
}

//logout route

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.status(400).json({ message: "No refresh token provided" })
        //find user by this token 
        const user = await User.findOne({ refreshTokens: refreshToken })
        // Remove this token from refreshTokens array
        if (user) {
            user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken)
            await user.save()
        }
        // Clear the cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"

        })
        return res.status(200).json({ message: "Logged out Successfully" })
    } catch (e) {
        return res.status(500).json({ message: "Error during logout", error: e.message })
    }

}



//forgot password
const forgotpassword = async (req, res) => {
    try {
        const { identifier } = req.body

        if (!identifier) return res.status(400).json({ message: "Field is required" })
        let emailcheck = validator.isEmail(identifier)
        let phonecheck = /^\+[1-9]\d{6,14}$/.test(identifier)
        let user
        // email check
        if (emailcheck) {
           user = await User.findOne({ email: identifier })
            if (!user) return res.status(404).json({ message: "We couldn’t find an account with this email. Please check and try again." })
            const uniqueToken = crypto.randomBytes(32).toString("hex")
            user.resetToken = uniqueToken
            user.resetTokenExpiry = Date.now() + 15 * 60 * 1000
            await user.save()
            //replace below resetlinkPassword code  with production url for resetting password
            // const resetLinkPassword = `https://filmydock-frontend.onrender.com/change-password/${uniqueToken}`
            // const transporter = nodemailer.createTransport({
            //     host: "smtp.gmail.com",
            //     port: 465,
            //     secure: true,
            //     auth: {
            //         user: process.env.USER_EMAIL,
            //         pass: process.env.USER_PASSWORD,
            //     },
            // })
            
            //sending password reset link mail to user
            await resend.emails.send({
                from: `filmy dock <${process.env.RESEND_DOMAIN}>`,
                to: user.email,
                subject: "Password Reset Link",
                html: `
             <p>Click below to reset your password</p>
            <a href="${resetLinkPassword}">${resetLinkPassword}</a>
            <br/><br/>
            <p>Link expires in 15 minutes</p> 
            `
            })
            return res.status(200).json({ message: "Password reset link sent to email" })

            //phone number check

        } else if (phonecheck) {
            user = await User.findOne({ phoneNumber: identifier })
            if (!user) return res.status(404).json({ message: "We couldn’t find an account with this phone number" })
            return res.status(200).json({ message: "User exists, proceed with OTP verification" })

        } else {
            return res.status(400).json({
                message: "Enter valid email or phone number +919876543210 format"
            });
        }

    } catch (e) {

        return res.status(500).json({ message: "forgot password error", error: e.message })
    }

}


//reset password

const resetPassword = async (req, res) => {

    try {
        const { uniquePasswordresetToken } = req.params  //only for email
        const { newPassword, newConfirmPassword, phoneNumber } = req.body //here phone number for phone only

        if (!newPassword || !newConfirmPassword) return res.status(400).json({ message: "Password fields cannot be empty" })
        //match confirm password
        if (newPassword !== newConfirmPassword) return res.status(400).json({ message: "Passwords do not match. Try again." });

        let user

        //phone rest flow
        if (phoneNumber) {
            // phone based reset (already OTP verified in frontend)
            user = await User.findOne({ phoneNumber });
            if (!user) return res.status(404).json({ message: "User not found" });
        } else {
            user = await User.findOne({
                resetToken: uniquePasswordresetToken,
                resetTokenExpiry: { $gt: Date.now() }
            })
            if (!user) return res.status(400).json({ message: "invalid or expired token" })
        }


        //validate password strength
        if (!validator.isStrongPassword(newPassword)) {
            return res.status(400).json({ message: "Passwords do not match criteria. Try again." })
        }


        //prevent old password reuse
        const issamepassword = await bcrypt.compare(newPassword, user.password)
        if (issamepassword) return res.status(400).json({ message: "Try a new password — it can’t match your old one." })

        //hash and save new password 
        const hashednewPassword = await hashedPassword(newPassword)
        user.password = hashednewPassword

        //clearing token for email flow
        if (!phoneNumber) {
            user.resetToken = undefined
            user.resetTokenExpiry = undefined
        }

        await user.save()
        return res.json({ message: "Your password has been updated. You can now log in with your new credentials." });

    } catch (e) {
        return res.status(500).json({ message: "Reset password Error", error: e.message })
    }

}

//google login+registration route

const googleAuth = async (req, res) => {
    try {
        const { token } = req.body
        if (!token) return res.status(400).json({ message: "Token is required" })

        //verifying token and extracting info of user
        const { email, googleId, email_verified } = await verifyGoogle(token)
        if (!email) return res.status(400).json({ message: "Google account has no email" })
        if (!email_verified) return res.status(400).json({ message: "Please verify your google email" })
        //checking user exists
        const userexists = await User.findOne({ email }).populate("role")
        if (userexists && !userexists.googleId) {
            // If user exists but didn't signup with Google before

            return res.status(400).json({
                message: "Account exists with email/password — please login normally"
            });
        }

        //if user exits login
        if (userexists) {
            const userPayload = { id: userexists._id, role: userexists.role.name }
            const accessToken = generateaccessToken(userPayload)
            const refreshToken = generaterefreshToken(userPayload, true)
            userexists.refreshTokens.push(refreshToken)
            await userexists.save()

            //sending token via cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            })
            return res.status(200).json({ accessToken, message: "google login successful" })

        }

        //find role "user"
        let userRole = await Role.findOne({ name: "user" })

        // if not exists → create default user role
        if (!userRole) {
            userRole = await Role.create({
                name: "user",
                permissions: {}
            })
        }
        //if user doesnot exits signup+login (creating user to database)

        const newUser = await User.create({
            email, googleId, acceptedTerms: true, role: userRole._id
        })
        await newUser.populate("role")
        if (!newUser) return res.status(500).json({ message: "Failed to create user" })
        const userPayload = { id: newUser._id, role: newUser.role.name }
        //generating token
        const accessToken = generateaccessToken(userPayload)
        const refreshToken = generaterefreshToken(userPayload)
        newUser.refreshTokens.push(refreshToken)
        await newUser.save()

        //sending token via cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(201).json({ accessToken, message: "google signup successful" })

    } catch (e) {
        console.log("google authentication error", e)
        return res.status(500).json({ message: "Google authentication failed", error: e.message })
    }

}


const healthCheck = (req, res) => {
    res.status(200).json({ message: "API is working fine" });
  }


module.exports = { refreshtoken, registerUser, loginUser, logout, forgotpassword, resetPassword, googleAuth }