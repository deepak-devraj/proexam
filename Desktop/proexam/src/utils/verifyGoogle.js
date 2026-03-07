const {OAuth2Client}=require("google-auth-library")
const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

//google login and registration token verify function

const verifyGoogle=async(token)=>{
    const ticket=await client.verifyIdToken({
        idToken:token,
        audience:process.env.GOOGLE_CLIENT_ID
    })
    const payload=ticket.getPayload()
    return {email:payload.email,googleId:payload.sub,email_verified: payload.email_verified}
}

module.exports=verifyGoogle