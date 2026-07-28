import { logger } from '../logging/logger';

export interface PruneResult {
  prunedContext: string;
  tokensSaved: number;
}

/**
 * Context Pruning Engine
 * 
 * Simulates semantic context compression assuming 1 token = 4 characters.
 * If the context exceeds `maxTokens`, it slices the text to fit within the character limit
 * (maxTokens * 4), appends a compression marker, and calculates the exact number of tokens saved.
 * 
 * @param context Raw input document context string
 * @param maxTokens Maximum allowed input token threshold
 * @returns PruneResult containing prunedContext string and tokensSaved count
 */
export function pruneContext(context: string, maxTokens: number): PruneResult {
  if (!context) {
    return { prunedContext: '', tokensSaved: 0 };
  }

  // 1 token = 4 characters calculation
  const currentTokenCount = Math.ceil(context.length / 4);

  if (currentTokenCount <= maxTokens) {
    return {
      prunedContext: context,
      tokensSaved: 0,
    };
  }

  const maxChars = maxTokens * 4;
  const compressionNotice = '\n\n[...Context Compressed for Relevance...]';
  const sliceLength = Math.max(0, maxChars - compressionNotice.length);

  const prunedContext = context.slice(0, sliceLength) + compressionNotice;
  const prunedTokenCount = Math.ceil(prunedContext.length / 4);
  const tokensSaved = Math.max(0, currentTokenCount - prunedTokenCount);

  logger.info(
    {
      originalTokens: currentTokenCount,
      targetMaxTokens: maxTokens,
      prunedTokens: prunedTokenCount,
      tokensSaved,
    },
    '[TokenPruner] Context successfully compressed'
  );

  return {
    prunedContext,
    tokensSaved,
  };
}
