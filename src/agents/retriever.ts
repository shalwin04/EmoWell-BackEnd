import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

export async function getRetriever() {
  const weburls = [
    "https://www.choosingtherapy.com/what-to-say-to-someone-with-depression/",
    "https://www.nhs.uk/every-mind-matters/supporting-others/helping-others/",
    "https://mhanational.org/resources/get-professional-help-if-you-need-it/",
  ];

  const pdfs = [
    "/Users/shalwinsanju/Documents/Projects/EmoWell/EmoWell-Docs[refs]/GB_MentalHealth_ConversationAboutMentalHealth.pdf",
    "/Users/shalwinsanju/Documents/Projects/EmoWell/EmoWell-Docs[refs]/GB_MentalHealth_HowToDealWithAnxiety.pdf",
    "/Users/shalwinsanju/Documents/Projects/EmoWell/EmoWell-Docs[refs]/GB_MentalHealth_HowToDealWithDepression.pdf",
    "/Users/shalwinsanju/Documents/Projects/EmoWell/EmoWell-Docs[refs]/GB_MentalHealth_MindfulnessTips.pdf",
    "/Users/shalwinsanju/Documents/Projects/EmoWell/EmoWell-Docs[refs]/GB_MentalHealth_ParentsPromotingMentalWellness.pdf",
  ];

  // Load documents from web URLs
  const webDocs = await Promise.all(
    weburls.map((url) => new CheerioWebBaseLoader(url).load())
  );
  const webDocsList = webDocs.flat();

  // Load PDFs
  const pdfLoaders = pdfs.map(
    (pdfPath) => new PDFLoader(pdfPath, { parsedItemSeparator: "" })
  );
  const pdfDocs = await Promise.all(pdfLoaders.map((loader) => loader.load()));
  const pdfDocsList = pdfDocs.flat();

  // Merge all documents
  const allDocs = [...webDocsList, ...pdfDocsList];

  // Split documents into smaller chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 250,
  });

  const docSplits = await textSplitter.splitDocuments(allDocs);

  // Google Generative AI Embeddings
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
