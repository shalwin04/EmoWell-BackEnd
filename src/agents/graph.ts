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
  .addNode("summaryAgent", summaryAgent);

// Main execution edges
workflow.addEdge(START, "retrieve");
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
  summarize: "summaryAgent",
  skip: END,
});

workflow.addEdge("summaryAgent", END);

const checkpointer = new MemorySaver();
const compiledGraph = workflow.compile({ checkpointer });

export { compiledGraph };
