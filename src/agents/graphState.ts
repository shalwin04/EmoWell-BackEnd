import { Annotation } from "@langchain/langgraph";
import { type DocumentInterface } from "@langchain/core/documents";
import { BaseMessage } from "@langchain/core/messages";

// Represents the state of our graph.
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  documents: Annotation<DocumentInterface[]>({
    reducer: (x, y) => y ?? x ?? [],
  }),
  question: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  therapyResponse: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  generation: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  generationVQuestionGrade: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  generationVDocumentsGrade: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  startTime: Annotation<number>({
    reducer: (x, y) => y ?? x,
  }),
  summary: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  journalEntry: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  journalSummary: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  mood_keyword: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "mental health",
  }),
  lastTherapyTime: Annotation<number>({
    reducer: (x, y) => y ?? x,
  }),
  riskLevel: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "low",
  }),
  emergencyAlert: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
    default: () => "",
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  userName: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  emergencyContact: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  youtubeResults: Annotation<DocumentInterface[]>({
    reducer: (x, y) => x.concat(y),
  }),
});
