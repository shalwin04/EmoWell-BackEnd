import express from "express";
import dotenv from "dotenv";
import { TherapyAgent } from "./agents/therapyAgent.js";
import { HumanMessage } from "@langchain/core/messages";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { GraphState } from "./agents/graphState.js";
import { compiledGraph } from "./agents/graph.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// async function startTherapySession() {
//   const agentFinalState = await TherapyAgent.invoke(
//     { messages: [new HumanMessage("Hey, I'm feeling a bit down today")] },
//     { configurable: { thread_id: "42" } }
//   );

//   console.log(
//     agentFinalState.messages[agentFinalState.messages.length - 1].content
//   );
// }

const runAgent = async (question: string) => {
  const inputs = { question };
  const config = { recursionLimit: 50 };

  const prettifyOutput = (output: Record<string, any>) => {
    const key = Object.keys(output)[0];
    const value = output[key];
    console.log(`Node: '${key}'`);
    if (key === "retrieve" && "documents" in value) {
      console.log(`Retrieved ${value.documents.length} documents.`);
    } else if (key === "gradeDocuments" && "documents" in value) {
      console.log(
        `Graded documents. Found ${value.documents.length} relevant document(s).`
      );
    } else {
      console.dir(value, { depth: null });
    }
  };

  console.log("\n--- Starting LangGraph Execution ---\n");

  for await (const output of await compiledGraph.stream(inputs, config)) {
    prettifyOutput(output);
    console.log("\n--- ITERATION END ---\n");
  }

  console.log("\n--- Execution Complete ---\n");
};

// Example usage
runAgent("Hey, I'm feeling a bit down today");

// startTherapySession();

// const supabasePrivateKey = process.env.SUPABASE_KEY as string;
// const supabaseUrl = process.env.SUPABASE_URL as string;

// const supabase = createClient(supabaseUrl, supabasePrivateKey);

// const agentFinalState = await agent.invoke(
//   { messages: [new HumanMessage("what is the current weather in sf")] },
//   { configurable: { thread_id: "42" } }
// );

// console.log(
//   agentFinalState.messages[agentFinalState.messages.length - 1].content
// );

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
