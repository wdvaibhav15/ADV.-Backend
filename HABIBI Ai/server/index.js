import cors from "cors";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
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
app.use(cors({
    origin: process.env.CLIENT_URL
}));
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res
    .status(200)
    .json({
      message: "hello from RAG" ,
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


// agent groq using langchain
const llm = new ChatGroq({
  model: "openai/gpt-oss-20b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.7,
  maxTokens: 256,
  maxRetries: 2,
}).bindTools(tools);



const callLLM = async (state) => {
  console.log(state);
  const response = await llm.invoke([
    {
      role: "system",
      content: `
            You are HABIBI AI assistant.
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
    try {
        const { input, threadId } = req.body;

        if (!input || typeof input !== "string" || !input.trim()) {
            return res.status(400).json({
                success: false,
                message: "Input is required"
            });
        }

        const response = await graph.invoke(
            {
                messages: [
                    {
                        role: "user",
                        content: input.trim()
                    }
                ]
            },
            {
                configurable: {
                    thread_id: String(threadId || "default")
                }
            }
        );

        const lastMessage = response.messages.at(-1);

        return res.status(200).json({
            success: true,
            AI: lastMessage.content,
            message: "success"
        });

    } catch (error) {
        console.error("AI Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
