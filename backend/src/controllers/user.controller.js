import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { APIResponse } from "../utils/ApiResponse.js";


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


    const existingUser=User.findOne({
        $or: [{username},{email}]
    })


    if(existingUser){
        throw new ApiError(409, "This user already exists")
    }

    // this avatar name comes from the file name in the middleware's name field
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path


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
    

export {registerUser}