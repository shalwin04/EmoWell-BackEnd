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

const workflow = new StateGraph(GraphState)
  // Define the nodes
  .addNode("retrieve", retrieve)
  .addNode("gradeDocuments", gradeDocuments)
  .addNode("generate", generate)
  .addNode(
    "generateGenerationVDocumentsGrade",
    generateGenerationVDocumentsGrade
  )
  .addNode("transformQuery", transformQuery)
  .addNode(
    "generateGenerationVQuestionGrade",
    generateGenerationVQuestionGrade
  );

// Build graph
workflow.addEdge(START, "retrieve");
workflow.addEdge("retrieve", "gradeDocuments");
workflow.addConditionalEdges("gradeDocuments", decideToGenerate, {
  transformQuery: "transformQuery",
  generate: "generate",
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

workflow.addConditionalEdges(
  "generateGenerationVQuestionGrade",
  gradeGenerationVQuestion,
  {
    useful: END,
    "not useful": "transformQuery",
  }
);

// Compile
const compiledGraph = workflow.compile();

export { compiledGraph };
