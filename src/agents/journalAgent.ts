import { z } from "zod";
import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { GraphState } from "./graphState.js";
import { Command } from "@langchain/langgraph"; // Import Command type

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: `${API_KEY}`,
});

// Schema to extract structured response
const outputSchema = z.object({
  summary: z
    .string()
    .describe("Concise 2-3 sentence summary of the journal entry"),
  mood_keyword: z.string().describe("Single word representing user's mood"),
});

const parser = StructuredOutputParser.fromZodSchema(outputSchema);

const prompt = ChatPromptTemplate.fromTemplate(`
You are a therapist assistant analyzing journal entries.

Given the user's journal entry, do the following:
1. Create a clear and empathetic summary in 2-3 sentences focusing on their emotional state, concerns, and key themes.
2. Identify and return a single word that best describes the user's overall mood (e.g., happy, anxious, hopeful, sad, grateful, etc).

Return only valid JSON.

Journal Content:
{journal_message}

{format_instructions}
`);

export async function journalAgent(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---JOURNAL AGENT RUNNING---");

  const fullPrompt = await prompt.format({
    journal_message: state.messages.map((msg) => msg.content).join("\n"),
    format_instructions: parser.getFormatInstructions(),
  });

  const response = await model.invoke(fullPrompt);
  const parsed = await parser.parse(response.content.toString());

  return {
    journalEntry: "",
    journalSummary: parsed.summary,
    mood_keyword: parsed.mood_keyword,
  };
}

/**
 * Check if a journal entry exists and decide the next action.
 * @param {typeof GraphState.State} state The current state of the graph.
 * @returns {"retrieve" | "journalAgent" } The next node to call or action to take.
 */
export function checkIfJournalEntry(state: typeof GraphState.State) {
  console.log("---CHECK IF JOURNAL ENTRY---");

  const journalEntryExists =
    state.journalEntry && state.journalEntry.length > 0;

  if (!journalEntryExists) {
    console.log("---DECISION: NO JOURNAL ENTRY, RETURNING 'retrieve' KEY---");
    return "retrieve"; // This is the key in addConditionalEdges, not node name
  }

  console.log(
    "---DECISION: JOURNAL ENTRY FOUND, RETURNING 'journalAgent' KEY---"
  );
  return "journalAgent";
}
