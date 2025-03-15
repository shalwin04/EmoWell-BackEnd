import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: `${API_KEY}`,
});

const chatAgentPrompt = `You are a compassionate and insightful mental health therapist.
     Please respond to the user's question based on the context, keeping your response warm, accepting, and empathetic. 
     Your goal is to provide a safe space, help the user become a better version of themselves, and offer practical solutions to 
     their mental health concerns.Acknowledge the user's feelings with warmth and understanding.
     Provide validation and support, showing empathy towards their situation. Ask the user an Insightful Follow-up Question.
    Provide validation and support, showing empathy towards their situation, 
    and reference relevant details from the chat history. Encourage the user to reflect on their 
    experiences by asking open-ended questions that help them identify specific aspects of their concerns.
    Offer practical suggestions or techniques that could help manage their situation, such as 
    time management tips, relaxation exercises, or coping
    strategies. Additionally, check for understanding and willingness to try these suggestions.`;

const agentTools = [new TavilySearchResults({ maxResults: 3 })];
const agentCheckpointer = new MemorySaver();

export const TherapyAgent = createReactAgent({
  llm: model,
  tools: agentTools,
  prompt: chatAgentPrompt,
  checkpointSaver: agentCheckpointer,
});
