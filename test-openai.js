
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API connection...");
    console.log("API Key present:", process.env.OPENAI_API_KEY ? "Yes" : "No");
    
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 10
    });
    
    console.log("✅ OpenAI API test successful!");
    console.log("Response:", res.choices[0].message.content);
    console.log("Model used:", res.model);
    console.log("Usage:", res.usage);
    
  } catch (error) {
    console.log("❌ OpenAI API test failed!");
    console.log("Error type:", error.constructor.name);
    console.log("Error message:", error.message);
    
    if (error.status) {
      console.log("HTTP Status:", error.status);
    }
    
    if (error.type) {
      console.log("Error type:", error.type);
    }
  }
}

testOpenAI();
