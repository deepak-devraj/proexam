const express=require("express")
const router=express.Router()

//importing user routes from controller
const {refreshtoken,registerUser,loginUser,logout,forgotpassword,resetPassword,googleAuth}=require("./auth.controller")
router.post("/userregister",registerUser)
router.post("/userlogin",loginUser)
router.post("/logoutuser",logout)
router.post("/forgotpassword",forgotpassword)
router.post("/reset-password/:uniquePasswordresetToken",resetPassword)
router.post("/googleauth",googleAuth)
router.post("/refresh-token",refreshtoken)



module.exports=router