import express from "express";
import dotenv from "dotenv";
dotenv.config();
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq";
import {
  Annotation,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

const app = express();
app.use(express.json());

const port = process.env.PORT || 1000;

app.get("/", (req, res) => {
  return res
    .status(200)
    .json({
      message: `hello from system design with ${process.env.SERVER_NAME}`,
    });
});

const tool = new TavilySearch({
  maxResults: 2,
  topic: "general",
});

// for storage or memory
const checkpointer = new MemorySaver();

// all tools
const tools = [tool];
const toolNode = new ToolNode(tools);

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
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.7,
  maxTokens: 256,
  maxRetries: 2,
}).bindTools(tools);

// state for graph to store or input from the user or output from the agent
// const state = Annotation.Root({
//     prompt: Annotation, // input
//     AIMessage: Annotation, // output
// })

const callLLM = async (state) => {
  console.log(state);
  const response = await llm.invoke([
    {
      role: "system",
      content: `
            You are Jarvis AI assistant.
            Use conversation memory first.
            Only use tools when the answer requires external real-time information like:
            weather, news, web search, stock prices etc.
            Do NOT call tools for simple conversation,
            memory-based questions, greetings,
            or personal context.
            `
    },
    ...state.messages,
  ]);
  return { messages: [response] };
};

const shouldContinue = (state) => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage.tool_calls?.length > 0) {
    return "tools";
  } else {
    return "__end__";
  }
};

// GRAPH
const graph = new StateGraph(MessagesAnnotation)
  .addNode("Agent", callLLM)
  .addNode("tools", toolNode)
  .addEdge("__start__", "Agent")
  .addEdge("tools", "Agent")
  .addConditionalEdges("Agent", shouldContinue)
  .compile({ checkpointer: checkpointer });

app.post("/api/ai", async (req, res) => {
  const { input } = req.body;
  const response = await graph.invoke(
    {
      messages: [
        {
          role: "user",
          content: input,
        },
      ],
    },
    {
      configurable: { thread_id: "user123" },
    },
  );

  console.log(response);
  res
    .status(200)
    .json({
      AI: response.messages[response.messages.length - 1].content,
      message: "success",
    });
});

// app.post("/api/ai", async (req, res) => {
//     try {
//         const { input } = req.body;
//         const response = await llm.invoke(input);

//         res.status(200).json({ "AI": response.content, message: "success" });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: error.message });
//     }
// });

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
