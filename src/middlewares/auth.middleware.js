import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT= asyncHandler(async (req ,_,next)=>{
     try {
        //cookies not in mobile app
       const token=req.cookies?.accessToken || req.header("Authorisation")?.replace("Bearer ","")
       if(!token){
           throw new ApiError(401,"Unauthorised request");
       }
       const decodedToken=  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
       if(!decodedToken){
           throw new ApiError(501,"Error decoding accesstoken")
       }
        
       const user= await User.findById(decodedToken?._id).
       select(" -password -refreshToken")
   
       if(!user){
           throw new ApiError(401,"Invalid Access Token")
       }
       req.user=user
       next()
     } catch (error) {
       throw  new ApiError(401,error?.message|| "Error verifying JWT")
     }
})