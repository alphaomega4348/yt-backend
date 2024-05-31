import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema= new Schema({
    video:{
        type:String,    //Cloudinary URL
        required:true,
    },
    thumbNail:{
        type:String,   //Cloudinary URL
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    duration:{
        type:Number,   //Cloudinary 
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    likes:{
        type:Number,
        default:0,
    },
    
},{timestamps:true,});

videoSchema.plugin(mongooseAggregatePaginate);

export const Vide= mongoose.model("Video",videoSchema);