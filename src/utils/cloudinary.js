import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localfilepath) => {
    try {
        if(!localfilepath) throw new Error("File path is required");

        const response= await cloudinary.uploader.upload(localfilepath,{
            resource_type: "auto",
        });
            // file has been uploaded successfully
            console.log("File uploaded on Cloudinary: ",response.url);
            return response;
    } catch (error) {
        fs.unlinkSync(localfilepath); //remove locally saved temporary file as the 
       // upload operation failed
        console.error("Error uploading file on Cloudinary: ",error);
    }
}