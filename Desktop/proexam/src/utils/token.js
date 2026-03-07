const jwt=require("jsonwebtoken")

//generating access token function
const generateaccessToken=(user)=>{
    return jwt.sign(user,process.env.ACCESS_SECRET,{expiresIn:"7d"})  //need to change back again to 30m 
}


//generating refresh token
const generaterefreshToken=(user,rememberMe=false)=>{
    return jwt.sign({...user,rememberMe},process.env.REFRESH_SECRET,{expiresIn:rememberMe?"30d":"7d"})
}


module.exports={generateaccessToken,generaterefreshToken}
