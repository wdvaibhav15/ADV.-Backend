import express from "express"
import dotenv from "dotenv"
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";

dotenv.config()

const port= process.env.PORT || 3000

const app=express()
app.use(express.json())




app.get("/",(req, res)=>{
    return res.status(200).json({message:`hello from system design with ${process.env.SERVER_NAME}`})
})

// User APIs
app.use("/api/user", userRouter);

app.listen(port,()=>{
    connectDB()
    console.log(`server started ${port}`)
})