const bcrypt=require("bcrypt")

//password hashing function
const hashedPassword=async (password)=>{
return await bcrypt.hash(password,parseInt(process.env.SALTROUND))
}

module.exports=hashedPassword