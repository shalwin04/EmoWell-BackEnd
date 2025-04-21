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
import { Graph, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./agents/graphState.js";
import { getUserData } from "./utils/getUserData.js";
import cache from "./utils/cacheData.js";
import { blogsAgent } from "./agents/blogsAgent.js";

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
  const config = {
    configurable: {
      thread_id: `user-signin-${Date.now()}`,
    },
  };

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

const handleUserSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    console.log("Received userId:", userId);

    const userData = await getUserData(userId);

    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    cache.set("userId", userData.userId);
    cache.set("emergencyContact", userData.emergencyContact);
    cache.set("userName", userData.userName);

    // ✅ Only send response after everything went fine
    res.status(200).json({
      message: "User signed in successfully",
      userData,
    });

    // console.log("Updated state:", updatedState);
  } catch (err) {
    console.error("Error in /sign-in endpoint:", err);
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

    const messages = [new HumanMessage(content)];

    // 🧠 Pass journalEntry inside the graph input state!
    const graphInputs = {
      messages,
      journalEntry: content, // ✅ this is how LangGraph gets state
    };

    const config = {
      configurable: {
        thread_id: `journal-${user_id}-${Date.now()}`,
      },
    };

    let summary = "";
    let mood = "";

    for await (const output of await compiledGraph.stream(
      graphInputs,
      config
    )) {
      const key = Object.keys(output)[0];
      const value = output[key];
      if (value?.journalSummary) summary = value.journalSummary;
      if (value?.mood_keyword) mood = value.mood_keyword;
    }

    const { data, error } = await supabase.from("journals").insert([
      {
        title,
        content,
        user_id,
        mood_keyword: mood_keyword || mood || null,
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

const fetchYouTubeVideos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // You would typically fetch the user's current state from your store/database,
    // but for now, let's assume you already have it
    // Example of fetching the state - you may want to adjust this based on how you're storing it
    const state = GraphState.State; // Assuming this holds the necessary data, e.g., mood_keyword

    // Call blogsAgent to fetch YouTube videos based on the mood_keyword in the state
    const result = await blogsAgent(state);

    if (result.youtubeResults && result.youtubeResults.length > 0) {
      // Return the YouTube video results
      res.status(200).json({
        message: "YouTube videos fetched successfully",
        videos: result.youtubeResults,
      });
    } else {
      res
        .status(404)
        .json({ message: "No YouTube videos found for this mood" });
    }
  } catch (error) {
    console.error("Error in fetchYouTubeVideos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Attach the handler separately
app.post("/chat", chatHandler);

app.post("/journal", addJournalEntry);

app.post("/sign-in", handleUserSignIn);

// app.get("/youtube", fetchYouTubeVideos);

// ✅ Single `app.listen()` call
app.listen(3000, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
