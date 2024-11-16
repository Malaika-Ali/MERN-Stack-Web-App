import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


// Method to generate access and refresh tokens
const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        // Passsing the above generated refreshToken to the user object
        // refresh token comes from the user model property
        user.refreshToken=refreshToken

        // Now we will save this access token
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens")
    }
}


// It registers users
const registerUser=asyncHandler(
    async (req,res)=>{
       const {username, email, fullname, password}=req.body
       console.log(`email ${email}, name ${fullname}, password ${password}`)

    //    if (fullname==="") {
    //     throw new ApiError(400, "Full Name is Required!")
    //    }

    if (
        [username, email, fullname, password].some((field)=>field?.trim()==='')
    ) {
       throw new ApiError(400, "All fields are required") 
    }

    if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        throw new ApiError(400, `Invalid email address format`);
    }


    const existingUser=await User.findOne({
        $or: [{username},{email}]
    })


    if(existingUser){
        throw new ApiError(409, "This user already exists")
    }

    // this avatar name comes from the file name in the middleware's name field
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path


    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files?.coverImage[0]?.path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar File is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Avatar File is required")
    }

    const user= await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })


    // checking if user already exists
    const userExisted=await User.findById(user._id).select("-password -refreshToken")

    if (!userExisted) {
        throw new ApiError(500, 'Something went wrong while registering the user')
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            userExisted,
            "User Registered Successfully!"
        )
    )


        })


const loginUser=asyncHandler(async(req,res)=>{
    // request body se data ley ao
    // check is username/email/required fields exist
    // find the user
    // if user existes, check password
    // access and refresh token
    // send these tokens in cookies
    // send success response

    const {email,username, password}=req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    // using the mongoDb or operator
    // This User comes from the schema we imported from the user model
    // Since the database is in another continent so need await here
    const user= await User.findOne({
        $or: [{username}, {email}]
    })

    // If user is not found
    if (!user) {
        throw new ApiError(404, "The user does not exist")
    }


    // ye argument wala password req.body se aya
    const isPasswordValid=await user.isPasswordCorrect(password)

    // if the password is not correct we get false and throw error
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password! Invalid user credentials")
    }

    // Destructuring the accessToken and  refresh token from the token generation function
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    // select tells which fields not to give
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")


    // set options for setting cookies
    // These options make the cookies modifiable only through server and only accessible to frontend and not modifiable through the frontend otherwise cookies are modifiable through frontend also
    const options={
        httpOnly: true,
        secure: true,

    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },
    "User Logged In successfully")
    )
})


// User Logout
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id, {
        $set : {refreshToken: undefined},
        
    },
    {new: true})


    const options={
        httpOnly: true,
        secure: true,

    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200,{},"User logged Out"))
})


// controller to refresh access token
const refreshAcccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken?._id)
    
    //  if fictitious token is given
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
    
        // Comparing incomingRefreshToken and the refreshToken saved in the user entry in the database
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, newRefreshToken
    
                },
                "Access Token refreshed successfully"
            )
        )
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refreshToken")
    }

})
    

export {registerUser, loginUser, logoutUser, refreshAcccessToken}