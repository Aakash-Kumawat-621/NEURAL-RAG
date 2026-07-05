import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getEmbeddingsModel } from "../lib/gemini";

async function main() {
  console.log("GOOGLE_API_KEY set:", !!process.env.GOOGLE_API_KEY);
  const model = getEmbeddingsModel();
  console.log("Model initialized. Class name:", model.constructor.name);

  const text = "Hello world";
  try {
    console.log("Testing embedQuery...");
    const res1 = await model.embedQuery(text);
    console.log("embedQuery successful! Length:", res1.length);
    console.log("Vector preview:", JSON.stringify(res1.slice(0, 5)));
  } catch (error) {
    console.error("embedQuery failed:", error);
  }

  try {
    console.log("Testing embedDocuments...");
    const res2 = await model.embedDocuments([text, "Bitcoin peer to peer"]);
    console.log("embedDocuments successful! Count:", res2.length);
    console.log("Doc 1 vector length:", res2[0].length);
    console.log("Doc 1 vector preview:", JSON.stringify(res2[0].slice(0, 5)));
  } catch (error) {
    console.error("embedDocuments failed:", error);
  }
}

main().catch(console.error);
