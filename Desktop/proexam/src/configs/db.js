const mongoose=require("mongoose")

// database connection

const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database Connected Successfully ✅")

    }catch(e){
        console.log("Database Connection Failed ❌: ",e.message)
        process.exit(1)

    }
}

module.exports=connectDB