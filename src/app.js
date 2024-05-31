import express from express;
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({ limit:"10mb"}));  //json parser
app.use(express.urlencoded({ extended: true })); //nested objects
app.use(express.static("public")); //public folder is static
app.use(cookieParser());    // cookie parser middleware

export default app;