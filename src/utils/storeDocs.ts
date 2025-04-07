import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Use Gemini or other embedding model
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
});

export async function storeDoc(text: string, metadata: any = {}) {
  const embedding = await embeddings.embedQuery(text); // returns a number[]

  const { error } = await supabase.from("rag_docs").insert([
    {
      content: text,
      embedding,
      metadata,
    },
  ]);

  if (error) {
    console.error("Failed to insert:", error);
  } else {
    console.log("Document inserted successfully");
  }
}
