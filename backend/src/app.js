import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express()

app.use(cors({
    // This option gives the URL of our frontend to our backend so that our backend allows the requests coming from that origin
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// sets the limit of json data
app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

// static se yahan hum ye bata rahey hain k koi bhi assets hue agar like pdfs, images , favicons toh unko mn apney server par public folder mn rakhna chahungi jo mn ne apne backend k folder mn banaya tha jiske andar temp folder bhi tha, yahan public us folder ka naam hai
app.use(express.static("public"))

app.use(cookieParser())


// Routes Import
import userRouter from './routes/user.routes.js'

// Routes declaration
app.use('/api/v1/users', userRouter)


export {app}