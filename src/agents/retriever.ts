import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getRetriever() {
  // Google Generative AI Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: `${API_KEY}`,
  });

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: "rag_docs", // or whatever your table name is
    queryName: "match_documents", // your RPC function name, can customize
  });

  const retriever = vectorStore.asRetriever();

  return retriever;
}
