import dotenv from 'dotenv'
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env"
})




connectDB()




// *********************************************First Approach

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from 'express';
// const app= express()
// starting iife with semi colon to terminate any previous iife
// ;(async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI/DB}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("Our application is not able to talk to the database", error)
//             throw error
//         })

//         app.listen(process.env.PORT, ()=>{
//             console.log("The aplication is listening", process.env.PORT)
//         })
//     }
//     catch(error){
//         console.log("Error Found!", error)
//     }

// })()