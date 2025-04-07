// ingestDocs.ts
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";
import { storeDoc } from "./storeDocs.js";

dotenv.config();

export async function ingestAndStoreDocs() {
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

  // Load web pages
  const webDocs = await Promise.all(
    weburls.map((url) => new CheerioWebBaseLoader(url).load())
  );
  const webDocsList = webDocs.flat();

  // Load PDFs
  const pdfLoaders = pdfs.map(
    (path) => new PDFLoader(path, { parsedItemSeparator: "" })
  );
  const pdfDocs = await Promise.all(pdfLoaders.map((loader) => loader.load()));
  const pdfDocsList = pdfDocs.flat();

  const allDocs = [...webDocsList, ...pdfDocsList];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 250,
  });

  const chunks = await splitter.splitDocuments(allDocs);

  // Store in Supabase
  for (const chunk of chunks) {
    await storeDoc(chunk.pageContent, chunk.metadata);
  }

  console.log("📥 All documents embedded and stored.");
}
