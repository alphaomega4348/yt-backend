// require("dotenv").config({path: "./env"});
import dotenv from "dotenv"; //Expereimental feature so update in package.json scripts
import mongoose from "mongoose";
import connectDB from "./db/index.js";
const PORT=process.env.PORT||8000;
dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on PORT : ${PORT}`);
    });
  })
  .catch((err) => console.log("Error connecting to DB!!!! ", err));









/*
;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`,)
    }
    catch(err){
        console.log(err);
        throw err;
    }
})();   // IIFE call iife stands for immediately invoked function expression

 */
