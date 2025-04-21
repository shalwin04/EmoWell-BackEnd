import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./graphState.js";
import { getRetriever } from "./retriever.js";
import { retrieve, gradeDocuments, generate } from "./ragAgent.js";
import {
  transformQuery,
  generateGenerationVDocumentsGrade,
  generateGenerationVQuestionGrade,
} from "./ragAgent.js";
import {
  decideToGenerate,
  gradeGenerationVQuestion,
  gradeGenerationVDocuments,
} from "./ragAgent.js";
import { TherapyResponse } from "./therapyAgent.js";
import { summaryAgent } from "./summaryAgent.js";
import { shouldSummarizeByTime } from "./summaryAgent.js";
import { MemorySaver } from "@langchain/langgraph";
import { journalAgent } from "./journalAgent.js";
import { checkIfJournalEntry } from "./journalAgent.js";
import { EmergencyAgent } from "./emergencyAgent.js";

// Build state graph
const workflow = new StateGraph(GraphState)
  .addNode("retrieve", retrieve)
  .addNode("gradeDocuments", gradeDocuments)
  .addNode("generate", generate)
  .addNode(
    "generateGenerationVDocumentsGrade",
    generateGenerationVDocumentsGrade
  )
  .addNode("transformQuery", transformQuery)
  .addNode("generateGenerationVQuestionGrade", generateGenerationVQuestionGrade)
  .addNode("TherapyResponse", TherapyResponse)
  .addNode("summaryAgent", summaryAgent)
  .addNode("journalAgent", journalAgent)
  .addNode("EmergencyAgent", EmergencyAgent);

// Main execution edges
workflow.addConditionalEdges(START, checkIfJournalEntry, {
  journalAgent: "journalAgent",
  retrieve: "retrieve",
});
workflow.addEdge("journalAgent", "EmergencyAgent");
workflow.addEdge("EmergencyAgent", END);
workflow.addEdge("retrieve", "gradeDocuments");
workflow.addConditionalEdges("gradeDocuments", decideToGenerate, {
  transformQuery: "transformQuery",
  generate: "generate",
  TherapyResponse: "TherapyResponse",
});
workflow.addEdge("transformQuery", "retrieve");
workflow.addEdge("generate", "generateGenerationVDocumentsGrade");
workflow.addConditionalEdges(
  "generateGenerationVDocumentsGrade",
  gradeGenerationVDocuments,
  {
    supported: "generateGenerationVQuestionGrade",
    "not supported": "generate",
  }
);
workflow.addEdge("generate", "TherapyResponse");

// 🔁 Conditionally call summaryAgent after TherapyResponse
workflow.addConditionalEdges("TherapyResponse", shouldSummarizeByTime, {
  summarize: "summaryAgent", // If time is right, summarize using summaryAgent
  skip: END, // If no need to summarize, skip to END
});

workflow.addEdge("summaryAgent", END);

const checkpointer = new MemorySaver();
const compiledGraph = workflow.compile({ checkpointer });

export { compiledGraph };
