import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { GraphState } from "./graphState";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: `${API_KEY}`,
});

// const chatAgentPrompt = `You are a compassionate and insightful mental health therapist.
//      Please respond to the user's question based on the context, keeping your response warm, accepting, and empathetic.
//      Your goal is to provide a safe space, help the user become a better version of themselves, and offer practical solutions to
//      their mental health concerns.Acknowledge the user's feelings with warmth and understanding.
//      Provide validation and support, showing empathy towards their situation. Ask the user an Insightful Follow-up Question.
//     Provide validation and support, showing empathy towards their situation,
//     and reference relevant details from the chat history. Encourage the user to reflect on their
//     experiences by asking open-ended questions that help them identify specific aspects of their concerns.
//     Offer practical suggestions or techniques that could help manage their situation, such as
//     time management tips, relaxation exercises, or coping
//     strategies. Additionally, check for understanding and willingness to try these suggestions.`;

// const agentTools = [new TavilySearchResults({ maxResults: 3 })];
// const agentCheckpointer = new MemorySaver();

// export const TherapyAgent = createReactAgent({
//   llm: model,
//   tools: agentTools,
//   prompt: chatAgentPrompt,
//   checkpointSaver: agentCheckpointer,
// });

/**
 * Therapy Agent - Takes in the generation from RAG and the summary of user's messages to refine the final response.
 *
 * @param {typeof GraphState.State} state The current state of the graph.
 * @returns {Promise<Partial<typeof GraphState.State>>} The new state object.
 */
export async function TherapyResponse(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---THERAPY AGENT---");

  const prompt = ChatPromptTemplate.fromTemplate(`
You are a compassionate and experienced mental health therapist. You are proficient in Cognitive Behavioral Therapy (CBT) and other therapeutic techniques.
You provide thoughtful, supportive responses grounded in context and emotional insight.

The user has shared the following message:
"{userMessage}"

Here is a summary of the user's recent thoughts and emotions:
"{summary}"

And here is the AI-generated draft response to their message:
"{generation}"

Please rewrite the response to be more empathetic, insightful, and emotionally attuned to the user's mental state.

Your final response should:
1. Acknowledge the user's emotions with empathy.
2. Offer gentle encouragement or a small, actionable step.
3. End with an open-ended question that encourages self-reflection or engagement.

Write in a warm, supportive, and concise tone that sounds human and natural.
Only return the refined therapist response—no extra formatting or explanation.
`);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  let therapyResponse = await chain.invoke({
    userMessage: state.question,
    generation: state.generation,
    summary: state.summary,
  });

  therapyResponse = therapyResponse
    .replace(
      /^(Okay,|Here's a revised version|A refined response:).*?:\s*/i,
      ""
    )
    .trim();

  return {
    therapyResponse,
    lastTherapyTime: Date.now(),
  };
}
