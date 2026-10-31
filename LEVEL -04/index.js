import express from "express";
import dotenv from "dotenv";
dotenv.config();
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq";



const app = express();
app.use(express.json()); 

const port = process.env.PORT || 1000;

app.get("/", (req, res) => {
    return res.status(200).json({ message: `hello from system design with ${process.env.SERVER_NAME}` });
});




// app.post("/api/ask", async (req, res) => {
//     try {

//         console.log("Request Body:", req.body);

//         const { input } = req.body;

//         if (!input) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Input is required"
//             });
//         }

//         const aiText = await generateAIResponse(input);

//         return res.status(200).json({
//             success: true,
//             response: aiText
//         });

//     } catch (error) {

//         console.error("Gemini Error:", error);

//         return res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });



// agent googleGemini using langc chain


// const llm = new ChatGoogleGenerativeAI({
//         model: "gemini-3.5-flash",
//         apiKey: process.env.GEMINI_API_KEY

// })

// app.post("/api/ai", async (req, res) => {
//     const { input } = req.body;
//     const response = await llm.invoke(input)
//     res.status(200).json({ "AI": response.content, message: "success" })
// })


// agent groq using langchain
const llm = new ChatGroq({
    model: "openai/gpt-oss-20b", 
    apiKey: process.env.GROQ_API_KEY
});

app.post("/api/ai", async (req, res) => {
    try {
        const { input } = req.body;
        const response = await llm.invoke(input);
        
        res.status(200).json({ "AI": response.content, message: "success" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});





app.listen(port, () => {
    console.log(`server started on port ${port}`);
});