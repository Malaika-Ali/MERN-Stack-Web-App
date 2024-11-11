import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema=new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        // makes the field searchable optimised for this field
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        // Cloudinary URL
        type: String,
        required: true,
    },
    coverImage:{
        // Cloudinary URL
        type: String,
    },
    watchHistory:
         [
            {
                type:Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
    password: {
        type: String,
        required: [true, 'Password is Required!'],
    },
    refreshToken:{
        type: String
    }
},{timestamps: true})

// This save tells that just before saving the data I wanna perform this pre hook code
userSchema.pre("save", async function(next){
    // the field name that we need to check if it's modified or not should be passed as string
    // Checks if the password field is not modified then pass the next middleware and nothing happens
    if(!this.isModified("password")) return next();

    // hashing the password field with 10 rounds
    this.password = await bcrypt.hash(this.password, 10)
    next()
}
)


// Defining a custom method here to check the password
userSchema.methods.isPasswordCorrect= async function(password) {
    return await bcrypt.compare(password, this.password)
}
// This happens fast and we don't need asyn await here
userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User", userSchema)