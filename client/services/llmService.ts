import { ComicPage } from "../types";

// Configuration for the APIs
const DEFAULT_OLLAMA_ENDPOINT = import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434';
const DEFAULT_OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const DEFAULT_OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemma-2-9b-it';
const DEFAULT_GEMMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'gemma:2b'; // Default to gemma 2b

interface GenerationRequest {
  title: string;
  description: string;
  style: string;
  pageCount: number;
}

export interface GenerationResult {
  pages: ComicPage[];
  usedService: 'ollama' | 'openrouter';
  modelUsed: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class LLMService {
  private ollamaEndpoint: string;
  private openRouterApiKey: string;
  private openRouterModel: string;
  private gemmaModel: string;

  constructor() {
    this.ollamaEndpoint = DEFAULT_OLLAMA_ENDPOINT;
    this.openRouterApiKey = DEFAULT_OPENROUTER_API_KEY;
    this.openRouterModel = DEFAULT_OPENROUTER_MODEL;
    this.gemmaModel = DEFAULT_GEMMA_MODEL;
  }

  // Getters and setters to allow configuration from outside
  getOllamaEndpoint(): string {
    return this.ollamaEndpoint;
  }

  setOllamaEndpoint(endpoint: string): void {
    this.ollamaEndpoint = endpoint;
  }

  getOpenRouterApiKey(): string {
    return this.openRouterApiKey;
  }

  setOpenRouterApiKey(apiKey: string): void {
    this.openRouterApiKey = apiKey;
  }

  getOpenRouterModel(): string {
    return this.openRouterModel;
  }

  setOpenRouterModel(model: string): void {
    this.openRouterModel = model;
  }

  getGemmaModel(): string {
    return this.gemmaModel;
  }

  setGemmaModel(model: string): void {
    this.gemmaModel = model;
  }

  /**
   * Check if Ollama is available
   */
  async isOllamaAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Ollama not available:', error);
      return false;
    }
  }

  /**
   * Generate comic script using Ollama
   */
  async generateWithOllama(request: GenerationRequest): Promise<ComicPage[]> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.gemmaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 2000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      
      if (!data.response) {
        throw new Error('No response from Ollama');
      }

      return this.parseResponse(data.response);
    } catch (error) {
      console.error('Error generating with Ollama:', error);
      throw error;
    }
  }

  /**
   * Generate comic script using OpenRouter API
   */
  async generateWithOpenRouter(request: GenerationRequest): Promise<ComicPage[]> {
    if (!this.openRouterApiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'KomaMaker AI'
        },
        body: JSON.stringify({
          model: this.openRouterModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert comic writer and visual storyteller. Generate comic scripts with detailed scene descriptions, dialogue, and narrative text. Respond with valid JSON only, following the exact structure provided in the prompt. Do not include any explanations or text outside the JSON structure.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}. ${errorData?.error?.message || ''}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter');
      }

      const content = data.choices[0].message.content;
      return this.parseResponse(content);
    } catch (error) {
      console.error('Error generating with OpenRouter:', error);
      throw error;
    }
  }

  /**
   * Build a detailed prompt for comic script generation
   */
  private buildPrompt(request: GenerationRequest): string {
    return `Generate a detailed comic script for "${request.title}".

Description: ${request.description}
Art Style: ${request.style}
Number of Pages: ${request.pageCount}

Follow this exact JSON format with no other text:
{
  "pages": [
    {
      "pageNumber": 1,
      "scenes": [
        {
          "id": "string",
          "prompt": "detailed visual description for image generation in ${request.style} style",
          "narrator": "narrative text for this panel",
          "dialogue": [
            {
              "id": "string",
              "character": "character name",
              "line": "dialogue line"
            }
          ]
        }
      ]
    }
  ]
}

Generate ${request.pageCount} pages with 2-4 scenes each. Make the visual descriptions vivid and appropriate for ${request.style} style. Include diverse character descriptions and interesting dialogue. Each scene should advance the story logically.`;
  }

  /**
   * Parse the LLM response into ComicPage objects
   */
  private parseResponse(response: string): ComicPage[] {
    try {
      // Clean the response to extract JSON
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      const jsonString = response.substring(jsonStart, jsonEnd);
      
      // If response doesn't contain JSON structure, create mock data
      if (jsonStart === -1 || jsonEnd === 0) {
        console.warn('LLM response did not contain valid JSON, using mock data');
        return this.generateMockScript();
      }
      
      const parsed = JSON.parse(jsonString);
      
      // Validate structure
      if (parsed.pages) {
        return parsed.pages;
      } else if (Array.isArray(parsed)) {
        return parsed;
      } else {
        console.warn('Unexpected response structure, using mock data');
        return this.generateMockScript();
      }
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      console.error('Response content:', response);
      
      // If we can't parse the response, return mock data as a fallback
      return this.generateMockScript();
    }
  }

  /**
   * Generate mock script as a fallback
   */
  private generateMockScript(): ComicPage[] {
    console.warn('Using mock script as fallback');
    
    // Base template for scenes
    const baseScenes = [
      {
        prompt: `Establishing wide shot of a futuristic cyberpunk city skyline, neon lights reflecting in rain puddles, high contrast. Style: ${this.gemmaModel}`,
        narrator: "The city never sleeps, but it does dream of electric sheep.",
        dialogue: []
      },
      {
        prompt: `Close up of the protagonist, a hooded figure with a glowing cybernetic eye, looking down at a holographic map. Style: ${this.gemmaModel}`,
        narrator: "",
        dialogue: [
          { id: `d1`, character: "Hero", line: "I'm close. The signal is coming from Sector 7." },
          { id: `d2`, character: "AI Companion", line: "Warning: Heavy security detected." }
        ]
      },
      {
        prompt: `Action shot: A massive security drone blocking the alleyway, red scanning lasers searching the smoke. Style: ${this.gemmaModel}`,
        narrator: "The path isn't going to be easy.",
        dialogue: [
          { id: `d3`, character: "Drone", line: "HALT. IDENTIFY YOURSELF." }
        ]
      },
      {
        prompt: `Dynamic angle: The hero drawing a plasma sword, blue energy crackling against the rain. Style: ${this.gemmaModel}`,
        narrator: "",
        dialogue: [
          { id: `d4`, character: "Hero", line: "Identify this." }
        ]
      }
    ];

    const pages: ComicPage[] = [];
    for (let i = 0; i < 2; i++) { // Default to 2 pages
      const scenes = baseScenes.map((s, idx) => ({
        id: `p${i + 1}-s${idx + 1}`,
        prompt: s.prompt.replace(this.gemmaModel, 'Manga'), // Replace model name with style
        narrator: i === 0 && idx === 0 ? s.narrator : (idx === 2 ? s.narrator : ""), // Only show narrator mainly on first page
        dialogue: s.dialogue.map(d => ({ ...d, id: `p${i + 1}-s${idx + 1}-${d.id}` })),
      }));

      pages.push({
        pageNumber: i + 1,
        scenes: scenes
      });
    }

    return pages;
  }

  /**
   * Main method that uses Ollama if available, otherwise OpenRouter
   */
  async generateComicScript(request: GenerationRequest): Promise<GenerationResult> {
    // First, check if Ollama is available
    const isOllamaAvailable = await this.isOllamaAvailable();
    
    if (isOllamaAvailable) {
      console.log('Using Ollama for comic script generation');
      const pages = await this.generateWithOllama(request);
      return {
        pages,
        usedService: 'ollama',
        modelUsed: this.gemmaModel
      };
    } else {
      console.log('Ollama not available, using OpenRouter for comic script generation');
      const pages = await this.generateWithOpenRouter(request);
      return {
        pages,
        usedService: 'openrouter',
        modelUsed: this.openRouterModel
      };
    }
  }
}

// Create a singleton instance
const llmService = new LLMService();

export { llmService, LLMService };