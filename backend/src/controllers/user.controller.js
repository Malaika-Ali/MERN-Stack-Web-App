import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


// Method to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // Passsing the above generated refreshToken to the user object
        // refresh token comes from the user model property
        user.refreshToken = refreshToken

        // Now we will save this access token
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens")
    }
}


// It registers users
const registerUser = asyncHandler(
    async (req, res) => {
        const { username, email, fullname, password } = req.body
        console.log(`email ${email}, name ${fullname}, password ${password}`)

        //    if (fullname==="") {
        //     throw new ApiError(400, "Full Name is Required!")
        //    }

        if (
            [username, email, fullname, password].some((field) => field?.trim() === '')
        ) {
            throw new ApiError(400, "All fields are required")
        }

        if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new ApiError(400, `Invalid email address format`);
        }


        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        })


        if (existingUser) {
            throw new ApiError(409, "This user already exists")
        }

        // this avatar name comes from the file name in the middleware's name field
        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath=req.files?.coverImage[0]?.path


        let coverImageLocalPath;

        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files?.coverImage[0]?.path
        }


        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar File is required")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!avatar) {
            throw new ApiError(400, "Avatar File is required")
        }

        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()

        })


        // checking if user already exists
        const userExisted = await User.findById(user._id).select("-password -refreshToken")

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


const loginUser = asyncHandler(async (req, res) => {
    // request body se data ley ao
    // check is username/email/required fields exist
    // find the user
    // if user existes, check password
    // access and refresh token
    // send these tokens in cookies
    // send success response

    const { email, username, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    // using the mongoDb or operator
    // This User comes from the schema we imported from the user model
    // Since the database is in another continent so need await here
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    // If user is not found
    if (!user) {
        throw new ApiError(404, "The user does not exist")
    }


    // ye argument wala password req.body se aya
    const isPasswordValid = await user.isPasswordCorrect(password)

    // if the password is not correct we get false and throw error
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password! Invalid user credentials")
    }

    // Destructuring the accessToken and  refresh token from the token generation function
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // select tells which fields not to give
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    // set options for setting cookies
    // These options make the cookies modifiable only through server and only accessible to frontend and not modifiable through the frontend otherwise cookies are modifiable through frontend also
    const options = {
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
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined },

    },
        { new: true })


    const options = {
        httpOnly: true,
        secure: true,

    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged Out"))
})


// controller to refresh access token
const refreshAcccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        //  if fictitious token is given
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }


        // Comparing incomingRefreshToken and the refreshToken saved in the user entry in the database
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

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


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed Successfully"))
})


// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current User fetched Successfully"))
})


// Updating Text based details of user
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname,
                email,

            }
        },
        // Due to this new: true property the information returned in the user variable here will be updated one
        { new: true }
    )
        .select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "Account Details Updated Successfully!"))

})


const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is Missing!")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on Cloudinary!")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            // set to change one field only not the whole object
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    )
    .select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Updated Avatar Image Successfully!"))

    
})

const updateUsercoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File is Missing!")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image on Cloudinary!")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            // set to change one field only not the whole object
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    )
    .select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Updated Cover Image Successfully!"))    
})


const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }


    const channel=await User.aggregate([
        {$match:{
            username: username?.toLowerCase()
        }},
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"] 
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                // To show when was your account created
                createdAt: 1
            }
        }
    ])


    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }
    
    console.log(channel);

    return res.status(200)
    .json(new ApiResponse(200, channel[0], "User Channel fetched successfully!"))
})


const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from : "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as : "watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )

    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "User's watch History fetched Successfully!"))
})





export { registerUser, loginUser, logoutUser, refreshAcccessToken, changeCurrentPassword, getCurrentUser,updateAccountDetails, updateUserAvatar, updateUsercoverImage, getUserChannelProfile, getWatchHistory }