import { ComicPage } from "../types";

// Configuration - these can be set via environment variables
const DEFAULT_API_ENDPOINT = import.meta.env.VITE_SD_API_ENDPOINT || 'http://localhost:7860';
const DEFAULT_API_TIMEOUT = parseInt(import.meta.env.VITE_SD_TIMEOUT || '60000');

interface GenerationRequest {
  prompt: string;
  negative_prompt?: string;
  steps?: number;
  width?: number;
  height?: number;
  cfg_scale?: number;
  sampler_name?: string;
  seed?: number;
  model?: string;
}

interface GenerationResponse {
  images: string[];
  parameters: any;
  info: any;
}

/**
 * Service to interact with your fine-tuned Stable Diffusion model
 */
class ImageGenerationService {
  private apiEndpoint: string;
  private timeout: number;
  private apiKey?: string;

  constructor(apiEndpoint?: string, timeout?: number, apiKey?: string) {
    this.apiEndpoint = apiEndpoint || DEFAULT_API_ENDPOINT;
    this.timeout = timeout || DEFAULT_API_TIMEOUT;
    this.apiKey = apiKey || import.meta.env.VITE_SD_API_KEY;
  }

  /**
   * Generate an image from a text prompt using your fine-tuned model with retry logic
   */
  async generateImage(request: GenerationRequest, maxRetries: number = 3): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        // Configure default parameters based on comic style
        const payload = {
          prompt: request.prompt,
          negative_prompt: request.negative_prompt || "ugly, deformed, disfigured, poor details, bad anatomy",
          steps: request.steps || 20,
          width: request.width || 1024,
          height: request.height || 1024,
          cfg_scale: request.cfg_scale || 7,
          sampler_name: request.sampler_name || "Euler a",
          seed: request.seed || -1,
          model: request.model || undefined, // Use your fine-tuned model name here if needed
          // Additional parameters that might be useful for comic art
          enable_hr: true,
          hr_scale: 1.5,
          hr_upscaler: "Latent",
          hr_second_pass_steps: 10,
          hr_resize_x: 0,
          hr_resize_y: 0,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add API key to headers if provided
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
          // Some APIs might use 'X-API-Key' instead
          // headers['X-API-Key'] = this.apiKey;
        }

        const response = await fetch(`${this.apiEndpoint}/sdapi/v1/txt2img`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Image generation failed: ${response.status} ${response.statusText}. Details: ${errorData}`);
        }

        const data: GenerationResponse = await response.json();
        
        if (!data.images || data.images.length === 0) {
          throw new Error('No images returned from the model');
        }

        // Return the first generated image as base64 string
        // You can convert this to a data URL or upload it somewhere based on your needs
        const imageData = data.images[0];
        return `data:image/png;base64,${imageData}`;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          // If this was the last attempt, throw the error
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, etc.
        console.warn(`Image generation attempt ${attempt + 1} failed:`, lastError.message);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // This shouldn't be reached, but TypeScript requires a return
    throw lastError || new Error('Unknown error during image generation');
  }

  /**
   * Batch generate images for multiple prompts
   */
  async generateBatch(prompts: string[], options?: {
    negative_prompt?: string;
    steps?: number;
    width?: number;
    height?: number;
    cfg_scale?: number;
    sampler_name?: string;
    model?: string;
  }): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < prompts.length; i++) {
      try {
        const image = await this.generateImage({
          prompt: prompts[i],
          negative_prompt: options?.negative_prompt,
          steps: options?.steps,
          width: options?.width,
          height: options?.height,
          cfg_scale: options?.cfg_scale,
          sampler_name: options?.sampler_name,
          model: options?.model
        });
        results.push(image);
      } catch (error) {
        console.error(`Failed to generate image for prompt ${i}:`, prompts[i]);
        console.error(error);
        
        // On failure, return a placeholder or throw
        throw new Error(`Failed to generate image ${i + 1} of ${prompts.length}: ${(error as Error).message}`);
      }
    }
    
    return results;
  }

  /**
   * Get the list of available models (optional, for model selection)
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(`${this.apiEndpoint}/sdapi/v1/sd-models`, {
        headers
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }
      const models = await response.json();
      return models.map((model: any) => model.title);
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }
  
  /**
   * Set the model to use for generation (if your API supports it)
   */
  async switchModel(modelName: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(`${this.apiEndpoint}/sdapi/v1/options`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sd_model_checkpoint: modelName
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error switching model:', error);
      return false;
    }
  }
}

// Create a singleton instance
const imageGenerationService = new ImageGenerationService();

export { imageGenerationService, ImageGenerationService, GenerationRequest };