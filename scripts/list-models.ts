import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_API_KEY");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      console.error("Failed to fetch models:", response.status, response.statusText);
      const errText = await response.text();
      console.error(errText);
      return;
    }
    const data = await response.json();
    console.log("Available models:");
    data.models?.forEach((m: any) => {
      console.log(`- Name: ${m.name}`);
      console.log(`  Supported Methods: ${m.supportedGenerationMethods.join(", ")}`);
    });
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

main().catch(console.error);
