import { logger } from '../logging/logger';

export interface ModelRouteResult {
  modelName: string;
  costPer1k: number;
}

/**
 * Dynamic Model Routing Engine
 * 
 * Routes specific agent workflow steps to the optimal model tier based on required intelligence:
 * - 'Planner' | 'Researcher': Route to high-reasoning 'gemini-3.5-flash' ($0.003 / 1k input tokens)
 * - 'Summarizer' | 'Formatter': Route to lightweight 'gemini-2.0-flash' ($0.000075 / 1k input tokens)
 * 
 * @param stepName Name of the agent step
 * @returns ModelRouteResult containing modelName and costPer1k
 */
export function routeModel(stepName: string): ModelRouteResult {
  const normalizedName = stepName.trim().toLowerCase();

  if (normalizedName === 'planner' || normalizedName === 'researcher') {
    logger.info({ stepName, modelName: 'gemini-3.5-flash' }, '[ModelRouter] Routing to reasoning tier model');
    return {
      modelName: 'gemini-3.5-flash',
      costPer1k: 0.003,
    };
  }

  if (normalizedName === 'summarizer' || normalizedName === 'formatter') {
    logger.info({ stepName, modelName: 'gemini-2.0-flash' }, '[ModelRouter] Routing to lightweight tier model');
    return {
      modelName: 'gemini-2.0-flash',
      costPer1k: 0.000075,
    };
  }

  // Fallback default tier
  logger.warn({ stepName }, '[ModelRouter] Unknown step name; defaulting to gemini-3.5-flash');
  return {
    modelName: 'gemini-3.5-flash',
    costPer1k: 0.003,
  };
}
