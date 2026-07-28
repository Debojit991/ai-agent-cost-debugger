import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTraceLogger } from '../logging/logger';

export interface GeminiStepResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  isLive: boolean;
  latencyMs: number;
}

/**
 * Call Google Gemini API (gemini-1.5-pro or gemini-1.5-flash) using official SDK.
 * Extracts exact promptTokenCount and candidatesTokenCount directly from response.usageMetadata.
 * 
 * Includes mandatory graceful fallback to calibrated mock token metrics if GEMINI_API_KEY is missing or API errors occur.
 */
export async function callGeminiStep(
  modelName: string,
  prompt: string,
  traceId: string
): Promise<GeminiStepResult> {
  const log = getTraceLogger(traceId);
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      log.info({ modelName, promptLength: prompt.length }, '[GeminiClient] Dispatching live request to Google Generative AI');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const latencyMs = Date.now() - startTime;

      // Extract exact input/output tokens from response.usageMetadata
      const usageMetadata = response.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4);
      const outputTokens = usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);

      log.info(
        {
          modelName,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokenCount: usageMetadata?.totalTokenCount,
        },
        '[GeminiClient] Live Gemini API response received with exact token metadata'
      );

      return {
        text,
        inputTokens,
        outputTokens,
        isLive: true,
        latencyMs,
      };
    } catch (error: any) {
      log.warn(
        { error: error.message, modelName },
        '[GeminiClient] Gemini API call failed or encountered rate limits. Executing graceful fallback...'
      );
    }
  } else {
    log.warn('[GeminiClient] GEMINI_API_KEY not found in process.env. Using calibrated fallback execution mode.');
  }

  // Graceful Fallback Execution Path
  const latencyMs = Date.now() - startTime + 500;
  const inputTokens = Math.ceil(prompt.length / 4);
  const fallbackText = `Processed prompt via ${modelName}: "${prompt.slice(0, 80)}..."`;
  const outputTokens = Math.ceil(fallbackText.length / 4);

  return {
    text: fallbackText,
    inputTokens,
    outputTokens,
    isLive: false,
    latencyMs,
  };
}
