const express=require("express")
const router=express.Router()

//importing user routes from controller
const {registerUser,loginUser,logout,forgotpassword,resetPassword}=require("./auth.controller")
router.post("/signup",registerUser)
router.post("/login",loginUser)
router.post("/logoutuser",logout)
router.post("/forgotpassword",forgotpassword)
router.post("/reset-password/:uniquePasswordresetToken",resetPassword)


module.exports=router