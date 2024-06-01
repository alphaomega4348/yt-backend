import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //Steps of registering a user
    /*
    1.> Get user details from frontend
    2.> Validate user details || rate limiter
    3.> Check if user already exists : username and email
    4.> Check for images, Check for avatar
    5.> Upload them to Cloudinary, Check avatar
    6.> Create user object- entry in DB.
    7.> Remove password and refresh token field from reponse
    8.> Check for user creation
    9.>Return response or error accordingly
    */
     //Step-1
      const {fullName,email,userName,password}=req.body;
      console.log(email);
      //Step-2
      if(
        [fullName,email,userName,password].some((field)=>{
                return field?.trim() ==="";}) //returns true if any field is empty
        )
      {
            throw new ApiError(400,"All fields are required");
      }
      //Step-3
     const existedUser = User.findOne({
        $or: [{ userName } , { email }]  //Check all the parameters if any exists then user already exists
      }); 
      if(existedUser){
        throw new ApiError(409,"User already exists");
      }
      //Step-4
      console.log(req.files);
      const avatarLocalPath= req.files?.avatar[0]?.path;//Provided by multer
      const coverImageLocalPath= req.files?.coverImage[0]?.path;
      if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
      }
      //Step-5
      const avatar =await uploadOnCloudinary(avatarLocalPath);
      const coverImage =await uploadOnCloudinary(coverImageLocalPath);
      if(!avatar){
        throw new ApiError(400, "Avatar upload unsuccesfull");
      }
      //Step-6
     const user= await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url||"",
            email,
            password,
            userName:userName.toLowerCase(),
      })
      //Step-7
      const createdUser = await user.findbyID(user._id).select(
        "-password -refreshToken "  //Removing fields
      )
      //Step-8
      if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user");
      }
      //Step-9
       return res.status(201).json(
        new ApiResponse(200,createdUser,"User successfully registered")
        )



} )
 

export {
    registerUser,
}