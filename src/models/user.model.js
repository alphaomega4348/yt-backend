import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema= new Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true

    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //Cloudinary URL
        default:"https://www.gravatar.com/avatar/",
        required:true
    },
    coverImage:{
        type:String, //Cloudinary URL
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:Video
    }],
    password:{
        type:String,
        required:[true,"Password is required"],
    },
    refreshToken:{
        type:String,
    },

    },{
        timestamps:true,});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
        this.password=await bcrypt.hash(this.password,10);
        next();
})
userSchema.methods.isPasswordCorrect=async function(Password){ 
    return await bcrypt.compare(Password,this.password);
}
userSchema.methods.generateAccessToken = async function() {
    try {
        const token = await jwt.sign(
            {
                _id: this._id,
                email: this.email,
                userName: this.userName,
                fullName: this.fullName,
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // Ensure this environment variable is set
        );
        return token;
    } catch (error) {
        console.error("Error generating access token:", error);
        throw new Error("Failed to generate access token");
    }
};
userSchema.methods.generateRefreshToken=async function(){
    try {
        const token = await jwt.sign(
            {
                _id: this._id,
                email: this.email,
                userName: this.userName,
                fullName: this.fullName,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } 
        );
        return token;
    } catch (error) {
        console.error("Error generating access token:", error);
        throw new Error("Failed to generate access token");
    }
};

export const User=mongoose.model("User",userSchema);

 