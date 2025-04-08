import express, {
  Application,
  Request,
  Response,
  RequestHandler,
} from "express";
import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { compiledGraph } from "./agents/graph.js";
import { ingestAndStoreDocs } from "./utils/ingestAndSToreDocs.js";
import { getRetriever } from "./agents/retriever.js";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// const retriever = await getRetriever();
// const results = await retriever.invoke("How to help someone with anxiety?");
// console.log(results);
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

const addJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, user_id, mood_keyword } = req.body;

    if (!title || !content || !user_id) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const { data, error } = await supabase.from("journals").insert([
      {
        title,
        content,
        user_id,
        mood_keyword: mood_keyword || null,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: "Journal entry added", data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Attach the handler separately
app.post("/chat", chatHandler);

app.post("/journal", addJournalEntry);

// ✅ Single `app.listen()` call
app.listen(3000, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
