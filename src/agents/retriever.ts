import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

export async function getRetriever() {
  const urls = [
    "https://www.choosingtherapy.com/what-to-say-to-someone-with-depression/",
    "https://www.nhs.uk/every-mind-matters/supporting-others/helping-others/",
    "https://mhanational.org/resources/get-professional-help-if-you-need-it/",
  ];

  // Load documents from URLs
  const docs = await Promise.all(
    urls.map((url) => new CheerioWebBaseLoader(url).load())
  );
  const docsList = docs.flat();

  // Split documents into smaller chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 250,
  });
  const docSplits = await textSplitter.splitDocuments(docsList);

  // Google Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: `${API_KEY}`,
  });

  // Add to vector store
  const vectorStore = await MemoryVectorStore.fromDocuments(
    docSplits,
    embeddings
  );

  return vectorStore.asRetriever();
}
