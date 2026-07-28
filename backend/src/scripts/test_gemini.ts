import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing with API Key:', apiKey ? `${apiKey.slice(0, 10)}...` : 'NONE');

  if (!apiKey) {
    console.error('No API key found');
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-pro'
  ];

  for (const m of modelsToTest) {
    try {
      console.log(`\nTesting model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('Hello Gemini, test connection');
      const text = res.response.text();
      console.log(` SUCCESS (${m}):`, text.slice(0, 60));
      console.log(` Tokens:`, res.response.usageMetadata);
    } catch (err: any) {
      console.log(` FAILED (${m}):`, err.message);
    }
  }
}

testModels();
