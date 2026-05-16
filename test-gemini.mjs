import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  try {
    const apiKey = 'AIzaSyAx1FtGRQB0-W9zsRP3lzAtomLvcomJWZA';
    
    // We can list models using REST API since SDK doesn't expose it directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available models:");
    data.models.forEach(m => console.log(m.name));
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testGemini();
