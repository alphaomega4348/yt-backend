import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessandRefreshTokens= async(userID)=>{
  try{
      const user= await User.findById(userID)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken=refreshToken
       await user.save({validateBeforeSave:false})

       return {accessToken, refreshToken}
  }
  catch(err){
    throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
  }
}

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
      //Step-2
      if(
        [fullName,email,userName,password].some((field)=>{
                return field?.trim() ==="";}) //returns true if any field is empty
        )
      {
            throw new ApiError(400,"All fields are required");
      }
      //Step-3
     const existedUser = await User.findOne({
        $or: [{ userName } , { email }]  //Check all the parameters if any exists then user already exists
      }); 
      if(existedUser){
        throw new ApiError(409,"User already exists");
      }
      //Step-4 
      const avatarLocalPath= req.files?.avatar[0]?.path;//Provided by multer
      //const coverImageLocalPath= req.files?.coverImage[0]?.path;
      let coverImageLocalPath;
      if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
        coverImageLocalPath=req.files .coverImage[0].path
      }

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
      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  // Exclude these fields
      );
      //Step-8
      if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user");
      }
      //Step-9
       return res.status(201).json(
        new ApiResponse(200,createdUser,"User successfully registered")
        )



})
const loginUser = asyncHandler(async (req,res)=>{
    //Steps for login 
    /*
    1.>req.body
    2.>username or email
    3.>search for user
    4.>check password
    5.>access and refresh token
    6.>send cookies
    7.> send response 
    */

    //Step-1
    const {username,email,password}=req.body
    if(!username && !email){
      throw new ApiError(400,"Username or email required")
    }
    //Step-2
    const user=await User.findOne({
      $or : [{username}, {password}]
    })
    //Step-3
    if(!user){
      throw new ApiError(404,"User does not exists")
    }
    //Step-4
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
      throw new ApiError(401,"Invalid user Credentials")
    }
    //Step-5
   const{accessToken,refreshToken}= await generateAccessandRefreshTokens(user.user_id)
    //Logical Step
    //Updating access and refresh token in user  
   const loggedInUser= await User.findById(user._id). 
   select(" -password -refreshToken")
    //Step-6
    const options={
        httpOnly:true,   //Only modifiable with server
        secure:true
    }
    return res.
    status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
      {
        user:loggedInUser,accessToken,refreshToken

      },
      "User LoggedIn Successfully"
      )
    )



})
const logOutUser = asyncHandler(async (req,res)=>{
    //Acess user to be logout using middlewares



})

export {
    registerUser,
    loginUser,
    logOutUser
}