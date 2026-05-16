import { GoogleGenerativeAI } from '@google/generative-ai';

async function testAllModels() {
  const apiKey = 'AIzaSyAx1FtGRQB0-W9zsRP3lzAtomLvcomJWZA';
  const gemini = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = [
    'gemini-3-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview'
  ];

  for (const modelName of modelsToTest) {
    try {
      const model = gemini.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("hi");
      console.log(`✅ ${modelName} works!`);
    } catch (err) {
      console.log(`❌ ${modelName} failed: ${err.message}`);
    }
  }
}

testAllModels();
