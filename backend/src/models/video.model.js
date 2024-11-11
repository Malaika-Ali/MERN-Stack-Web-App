import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema= new Schema({
    videoFile:{
        type: String,
        required: [true, "Video must be provided"],
    },
    thumbnail:{
        type: String,
        required: [true, "Thumbnail is Required"]
    },
    title:{
        type: String,
        required: [true, "Title is Required"]
    },
    description:{
        type: String,
        required: [true, "Title is Required"]
    },
    duration:{
        type: Number,
        required: true
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},
{timestamps: true})

// This allows us to write aggregation queries
videoSchema.plugin(mongooseAggregatePaginate)

export const Video=mongoose.model("Video", videoSchema)