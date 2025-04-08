import { z } from "zod";
import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { GraphState } from "./graphState.js";
import { END } from "@langchain/langgraph";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

// Define the LLM once. We'll reuse it throughout the graph.
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: `${API_KEY}`,
});

/**
 * Generate summary
 *
 * @param {typeof GraphState.State} state The current state of the graph.
 * @returns {Promise<Partial<typeof GraphState.State>>} The new state object.
 */
export async function summaryAgent(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---SUMMARY GENERATE---");

  const prompt =
    ChatPromptTemplate.fromTemplate(`You are an assistant that creates concise summaries of journal entries or messages. 
  Summarize the following content clearly in 2-3 sentences. Focus on the main emotions, themes, and thoughts expressed.
  
  Content:
  {message}
  
  Summary:`);

  const summaryChain = prompt.pipe(model).pipe(new StringOutputParser());

  const generation = await summaryChain.invoke({
    message: state.messages.map((msg) => msg.content).join("\n"),
  });

  return {
    summary: generation,
    lastTherapyTime: Date.now(),
  };
}

export function shouldSummarizeByTime(state: typeof GraphState.State) {
  const last = state.lastTherapyTime ?? 0;
  const now = Date.now();

  const tenMinutes = 10 * 60 * 1000;

  const shouldSummarize = now - last >= tenMinutes;
  console.log(
    `Last therapy at ${new Date(last).toISOString()}, now is ${new Date(
      now
    ).toISOString()} — Summarize: ${shouldSummarize}`
  );

  return shouldSummarize ? "summarize" : "skip";
}
