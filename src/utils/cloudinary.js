import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // File has been uploaded successfully, so unlink it to remove from local storage
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.log("Image Error :: ", error);
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as the upload operation failed
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    try {
        await cloudinary.api.delete_resources([url], { type: 'upload', resource_type: 'image' }).then(console.log);

    } catch (error) {
        console.log(error);
    }

}

export { uploadOnCloudinary, deleteFromCloudinary };
