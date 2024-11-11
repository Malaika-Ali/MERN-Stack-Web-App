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
import { app } from "./app.js";

dotenv.config({
    path:   './env'
})

// Since the connectDB method ddefined in the file is an asynchronous function and asynchronous functions return promises so we can .then() and .catch() methods on them.
connectDB().then(()=>{
    // this line tells the server to listen either on the port provided the deployment platform or on port 8000
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port number ${process.env.PORT}`)
    })
}).catch((error)=>{
    console.log("Mongo DB Connection failed!!!!!!!!!", error)
})




// for debugging the database connection related error
// console.log("checking env file", process.env.MONGODB_URI)