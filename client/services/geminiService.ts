import { ComicPage } from "../types";
import { llmService } from './llmService';

// Wrapper service that uses the new LLM service supporting both Ollama and OpenRouter
export const generateComicScript = async (
  title: string,
  description: string,
  style: string,
  pageCount: number
): Promise<ComicPage[]> => {
  console.log(`[LLM Service] Generating script for: ${title} in style ${style}`);
  
  try {
    const result = await llmService.generateComicScript({
      title,
      description,
      style,
      pageCount
    });
    
    return result.pages;
  } catch (error) {
    console.error('Error generating comic script:', error);
    throw error;
  }
};