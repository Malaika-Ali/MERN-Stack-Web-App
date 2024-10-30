// FIRST APPROACH: Where we pollute the db connection as well server listener at one place


// import mongoose from 'mongoose'
// import { DB_NAME } from './constants';
// import express from 'express'

// const app=express()

// ;(async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", ()=>{
//             console.log("Error!!!! Our application is not able to create communication connection between express and database")
//             throw error
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     }

//     catch(error){
//         console.log("incorporated error here: ", error)
//         throw error
//     }
// })()


import connectDB from "./database/index.js";
import dotenv from'dotenv'

dotenv.config({
    path:   './env'
})

connectDB()