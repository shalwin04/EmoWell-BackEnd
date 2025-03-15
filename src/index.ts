import express from "express";
import dotenv from "dotenv";
import { TherapyAgent } from "./agents/therapyAgent.js";
import { HumanMessage } from "@langchain/core/messages";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

async function startTherapySession() {
  const agentFinalState = await TherapyAgent.invoke(
    { messages: [new HumanMessage("Hey, I'm feeling a bit down today")] },
    { configurable: { thread_id: "42" } }
  );

  console.log(
    agentFinalState.messages[agentFinalState.messages.length - 1].content
  );
}

startTherapySession();

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
