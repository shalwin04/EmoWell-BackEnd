import express, {
  Application,
  Request,
  Response,
  RequestHandler,
} from "express";
import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { compiledGraph } from "./agents/graph.js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// ✅ Run the agent and return a response
const runAgent = async (question: string): Promise<string> => {
  const inputs = {
    question,
    startTime: Date.now(), // ⏱️ Add this line to track time
  };
  let config = { configurable: { thread_id: "convo-1" } };

  let assistantResponse = "I'm here to listen. How are you feeling today?";

  for await (const output of await compiledGraph.stream(inputs, config)) {
    const key = Object.keys(output)[0];
    const value = output[key];

    if (key === "TherapyResponse" && "therapyResponse" in value) {
      assistantResponse = value.therapyResponse;
    }
  }

  console.log("Final Assistant Response:", assistantResponse);
  return assistantResponse;
};

// ✅ Correct TypeScript typing: `Promise<void>` instead of `Promise<Response>`
const chatHandler: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const response: string = await runAgent(message);
    res.json({ response }); // ✅ No need to `return`
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Attach the handler separately
app.post("/chat", chatHandler);

// ✅ Single `app.listen()` call
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
