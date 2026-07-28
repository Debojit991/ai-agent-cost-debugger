import { z, ZodSchema } from 'zod';
import { logger } from '../logging/logger';

// 1. Structural Schema for Planner Output
export const PlannerOutputSchema = z.object({
  stepName: z.literal('Planner'),
  status: z.enum(['success', 'failed']),
  planSteps: z.array(z.string()).min(1, 'At least one plan step is required'),
  estimatedTokens: z.number().positive(),
});
export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;

// 2. Structural Schema for Researcher Output
export const ResearcherOutputSchema = z.object({
  stepName: z.literal('Researcher'),
  status: z.enum(['success', 'failed']),
  referencesCount: z.number().nonnegative(),
  researchData: z.string().min(10, 'Research data must contain meaningful content'),
});
export type ResearcherOutput = z.infer<typeof ResearcherOutputSchema>;

// 3. Structural Schema for Summarizer Output
export const SummarizerOutputSchema = z.object({
  stepName: z.literal('Summarizer'),
  status: z.enum(['success', 'failed']),
  summaryText: z.string().min(1, 'Summary text cannot be empty'),
  keyInsights: z.array(z.string()).min(1, 'Key insights array is required'),
});
export type SummarizerOutput = z.infer<typeof SummarizerOutputSchema>;

// 4. Structural Schema for Formatter Output
export const FormatterOutputSchema = z.object({
  stepName: z.literal('Formatter'),
  status: z.enum(['success', 'failed']),
  finalFormattedResponse: z.string().min(20, 'Final response must be comprehensive'),
});
export type FormatterOutput = z.infer<typeof FormatterOutputSchema>;

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates unknown LLM output against a strict Zod schema.
 * Returns explicit field-level error messages if validation fails, enabling auto-correction retries.
 * 
 * @param output Raw output object or string received from step
 * @param schema Zod schema to validate against
 * @returns ValidationResult<T>
 */
export function validateAndCorrect<T>(output: unknown, schema: ZodSchema<T>): ValidationResult<T> {
  const result = schema.safeParse(output);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format explicit z.ZodError messages per field
  const formattedError = result.error.errors
    .map((err) => `[Field: ${err.path.join('.') || 'root'}] ${err.message}`)
    .join('; ');

  logger.warn({ errorDetails: formattedError, output }, '[Validator] Output schema validation failed');

  return {
    success: false,
    error: formattedError,
  };
}
