import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { GraphState } from "./graphState.js";
import { sendMail } from "./sendEmergencyMail.js"; // Import the function to send email
import cache from "../utils/cacheData.js";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Step 1: Define schema
const emergencySchema = z.object({
  riskLevel: z.enum(["low", "moderate", "critical"]),
  alertMessage: z
    .string()
    .describe("Message to send to emergency contact if riskLevel is critical"),
});

const parser = StructuredOutputParser.fromZodSchema(emergencySchema);

// Step 2: Create prompt
const prompt = ChatPromptTemplate.fromTemplate(`
You are a responsible mental health risk detection assistant.

Your job is to evaluate whether the user's mental state appears *critical* and requires alerting their emergency contact.

Here is the user's latest message:
"{userMessage}"

Here is a summary of the user's recent mental state:
"{summary}"

Here is a summary of recent journal entries:
"{journalSummary}"

Analyze the user's mental health condition and classify the risk as:
- low
- moderate
- critical

If it's critical, write a respectful message to the emergency contact with:
- A short explanation of the concern
- A quote of the user's recent message or journal
- A recommendation to reach out or consult a professional

Return only valid JSON in this format:
{format_instructions}
`);

// Step 3: EmergencyAgent logic
export async function EmergencyAgent(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---EMERGENCY AGENT---");

  const formattedPrompt = await prompt.format({
    userMessage: state.messages,
    summary: state.summary,
    journalSummary: state.journalSummary,
    format_instructions: parser.getFormatInstructions(),
  });

  const response = await model.invoke(formattedPrompt);

  let parsed;
  try {
    parsed = await parser.parse(response.content.toString());
  } catch (err) {
    console.error("Failed to parse emergency output:", err);
    parsed = {
      riskLevel: "low",
      alertMessage: "",
    };
  }
  const emergencyContact = cache.get("emergencyContact") as string;

  if (parsed.riskLevel === "critical" && parsed.alertMessage) {
    if (!emergencyContact) {
      console.error(
        "Emergency contact is missing. Cannot send email.",
        emergencyContact
      );
      return {
        riskLevel: parsed.riskLevel,
        emergencyAlert: "Missing emergency contact.",
      };
    }
    try {
      await sendMail({
        to: emergencyContact,
        subject: "Emergency Alert: Critical Mental Health Risk",
        text: parsed.alertMessage,
      });
      console.log("passed alertMessage", parsed.alertMessage);
      console.log("Emergency email sent.");
    } catch (err) {
      console.error("Failed to send emergency email:", err);
    }
  }

  return {
    riskLevel: parsed.riskLevel,
    emergencyAlert: parsed.alertMessage,
  };
}
