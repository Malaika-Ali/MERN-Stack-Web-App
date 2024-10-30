import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB=async()=>{
    try{
        // Mongoose hamein ek return object deta hai toh hum isse ek variable mn store kar saktey hain
        // Connection karne k baad jo bhi response hamein database dega wo hum hold kar saktey hain is variable mn
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`mongo DB connected!! DB Host ${connectionInstance.connection.host}`);
        
    }
    catch(error){
        console.log("Error encountered while connecting the application to the database", error)
        // Node mn error condition par current process se exit karney ka tareeqa
        process.exit(1)
    }
}


export default connectDB