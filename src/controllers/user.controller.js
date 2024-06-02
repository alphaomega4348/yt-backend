import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async(userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken

      await user.save({ validateBeforeSave: false })

      return {accessToken, refreshToken}


  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

const registerUser = asyncHandler( async (req, res) => {
    //Steps of registering a user
    /*
    1.> Get user details from frontend
    2.> Validate user details || rate limiter
    3.> Check if user already exists : userName and email
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
    2.>userName or email
    3.>search for user
    4.>check password
    5.>access and refresh token
    6.>send cookies
    7.> send response 
    */

    //Step-1
    const {userName,email,password}=req.body
    if(!userName && !email){
      throw new ApiError(400,"userName or email required")
    }
    //Step-2
    const user=await User.findOne({
      $or : [{userName}, {password}]
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
   const{accessToken,refreshToken}= await generateAccessAndRefereshTokens(user._id)
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

const logoutUser = asyncHandler(async (req,res)=>{
    //Acess user to be logout using middlewares
    const userID= req.user._id
    await User.findByIdAndUpdate(userID,
      {
      $set:{
        refreshToken:undefined
      }
    },
      {
          new:true 
    })
    const options={
      httpOnly:true,
      secure:true
    }
    return res.
    status(200).
    clearCookie("accessToken",options).
    clearCookie("refreshToken",options).
    json(
      new ApiResponse(200,{},"User Logged Out Successfully")
    )
    


})

const refreshAccessToken=asyncHandler(async (req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken
   if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorised request")
   }
   try {
    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
    const user=await User.findById(decodedToken?._id)
    if(!user){
           throw new ApiError(401,"Invalid Refresh Token")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh Token is expired or used")
    }
 
     const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._id)
     const option={
       httpOnly:true,
       secure:true
     }
     return res
     .status(200)
     .cookie(accessToken,option)
     .cookie(newRefreshToken,option)
     .json(new ApiResponse(
       200,{
         accessToken,
         refreshToken:newRefreshToken
       },
       "Access token refreshed successfully"
     ))
   } catch (error) {
        throw new ApiError(500, error?.message  || "Error while refreshing token")
   }

})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid Old Password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
      new ApiResponse(200,{},"Password changed successfully")
    )
})

const getCurrentUser= asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current User fetch succesfully" ))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body

  if(!fullName || !email ){
    throw new ApiError(400,"All fields are required")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,{
        $set:{
          fullName,email
        }
    },{
      new:true
    }
    ).select("-password ")
    
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing")
  }


  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
      throw new ApiError(400, "Error while uploading on avatar")
      
  }

  const oldUrl = req.user.avatar
  const urlParts = oldUrl.split('/'); 
  const public_id = urlParts[urlParts.length - 1].split('.')[0]
  console.log(public_id);

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              avatar: avatar.url
          }
      },
      {new: true}
  ).select("-password")

  const deleteAvatar =  await deleteFromCloudinary(public_id,'image');

  return res
  .status(200)
  .json(
      new ApiResponse(200, {user,avatar}, "Avatar image updated successfully")
  )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading on avatar")
      
  }
  const oldUrl = req.user.avatar

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              coverImage: coverImage.url
          }
      },
      {new: true}
  ).select("-password")

  await deleteFromCloudinary(oldUrl);

  return res
  .status(200)
  .json(
      new ApiResponse(200, user, "Cover image updated successfully")
  )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
        const {userName}=req.params

        if(!userName?.trim()){
          throw new ApiError(400,"userName Missing")
        }

        const channel=await User.aggregate([
          {
            //Stage-1
            $match:{
              userName:userName?.toLowerCase(),


            }
          },
          {
            //Stage-2
            $lookup:{
              from:"subscriptions",
              localField:"_id",
              foreignField:"channel",
              as: "subscribers"

            }
          },
          {
            //Stage-3
            $lookup:{
              from:"subscriptions",
              localField:"_id",
              foreignField:"subscriber",
              as: "subscribedTo"

            }
          },
          {
            //Stage-4
            $addFields:{
              subscribersCount:{
                $size: "$subscribers",
              },
              channelsSubscribedToCount:{ 
                $size:"$subscribedTo"
              },
              isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false

                }
              }
            }
          },
          {
            $project:
            {
              fullName:1,
              userName:1,
              subscribersCount:1, 
              channelsSubscribedToCount:1,
              isSubscribed:1,
              avatar:1,
              coverImage:1,
              email:1
            }
          }
        ])
        console.log(channel);
        if(!channel?.length){
          throw new ApiError(400,"Channel do not exists")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,channel[0],"User Channel fetched succesfully"))
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      userName: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

