import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";

const app = express();
app.use(express.json());

const port = process.env.PORT || 1000;

app.get("/", (req, res) => {
  return res.status(200).json({
    message: `hello from system design with ${process.env.SERVER_NAME}`,
  });
});

// agent groq using langchain
const llm = new ChatGroq({
  model: "openai/gpt-oss-20b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.7,
  maxTokens: 256,
  maxRetries: 2,
});

// embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
});

// vector DB store using Qdrant
const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "grocery-store",
});

// upload pdf text to vectorDB
const upload = async () => {
  // pick up the pdf file and read it as buffer
  const pdfPath = "./details.pdf";
  // read the pdf file as buffer
  const buffer = fs.readFileSync(pdfPath);
  // parse the pdf file as number of pages and text
  const pdfResult = new PDFParse({ data: buffer });
  // get the text from the pdf file
  const result = await pdfResult.getText();
  // give all page text content in sangle page
  const text = result.text;
  // split the text into small small chunks of 1000 characters
  const spilitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });
  const docs = await spilitter.createDocuments([text]);
  await vectorStore.addDocuments(docs);
};

app.post("/api/ai", async (req, res) => {
  const { input } = req.body;
  const docs = await vectorStore.similaritySearch(input, 5);
  const context = docs.map((doc) => doc.pageContent).join("\n");

  const response = await llm.invoke([
    new SystemMessage(`You are a RAG AI assistant.
                        STRICT RULES:
                        - Answer ONLY from context
                        - Do not use outside knowledge
                        - If answer not found say:
                          "I don't know from uploaded PDF."

                        Context:
                        ${context}`),
                        new HumanMessage(input)
                          ]);

  return res.status(200).json({
    message: "success",
    AI: response.content
  });
});

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
