/**
 * AI API Router Service - Admin Panel Version
 * 
 * Centralized service for routing AI model requests to appropriate APIs.
 * - Gemini models → Google Gemini API
 * - All other models → OpenRouter API
 * 
 * This eliminates duplicate provider routing logic across the application.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

import { trackAIExecution, prepareAnalyticsData } from './ai-analytics';

export interface AIModelRequest {
  modelName: string;
  systemPrompt?: string | null;
  userPrompt?: string | null;
  prompt?: string;
  variables?: Record<string, string>;
  configuration?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  };
  // JSON parsing options
  parseResponse?: boolean;  // Whether to attempt JSON parsing
  strictJsonMode?: boolean; // Enforce JSON format more strictly (for system prompts)
  
  // Analytics tracking (simplified for admin panel)
  analytics?: {
    useCaseId: string; // Required for tracking (e.g., 'base-agent', 'quality-reviewer')
    category?: string; // Optional category (e.g., 'agent', 'workflow', 'playground')
    priority?: number; // Optional priority level
    metadata?: Record<string, any>; // Optional metadata
  };
}

export interface AIModelResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason: string;
  costUSD: number;
  provider: 'gemini' | 'openrouter';
  // JSON parsing fields
  parsedContent?: any;      // Parsed JSON content (when parseResponse=true)
  parseError?: string;      // JSON parsing error (when parsing fails)
  parseSuccess?: boolean;   // Whether parsing was successful
  response?: any;          // Raw provider response (for debugging)
}

export interface ProviderInfo {
  id: string;
  name: string;
  apiEndpoint: 'gemini' | 'openrouter';
}

export class AIAPIRouter {
  private static geminiClient: GoogleGenerativeAI | null = null;

  /**
   * Determine which API to use based on model name
   */
  static getProviderInfo(modelName: string): ProviderInfo {
    // Check if it's a Gemini model
    if (this.isGeminiModel(modelName)) {
      return {
        id: 'google',
        name: 'Google',
        apiEndpoint: 'gemini'
      };
    }
    
    // Default to OpenRouter for all other models
    return {
      id: 'openrouter',
      name: 'OpenRouter',
      apiEndpoint: 'openrouter'
    };
  }

  /**
   * Check if a model should use Gemini API
   */
  private static isGeminiModel(modelName: string): boolean {
    const geminiPatterns = [
      /^gemini-/i,
      /^google\/gemini/i,
      /^gemini-pro/i,
      /^gemini-flash/i
    ];
    
    return geminiPatterns.some(pattern => pattern.test(modelName));
  }

  /**
   * Normalize Gemini model IDs to the format expected by Google's SDK.
   */
  private static normalizeGeminiModelName(modelName: string): string {
    if (!modelName) return modelName;
    // Keep only the last path segment if slashes are present
    let lastSegment = modelName.split('/').pop() || modelName;
    // Some sources may prefix with "models/"
    lastSegment = lastSegment.replace(/^models\//i, '');

    // Alias known variants to canonical model IDs accepted by Google SDK
    const aliasMap: Record<string, string> = {
      'gemini-2.0-flash-lite-001': 'gemini-2.0-flash-lite',
      'gemini-2.0-flash-001': 'gemini-2.0-flash',
      'gemini-pro': 'gemini-1.0-pro',
    };

    if (aliasMap[lastSegment]) {
      return aliasMap[lastSegment];
    }

    // Fallback: strip trailing build suffixes like -001, -002 when present
    const stripped = lastSegment.replace(/-(\d{3})$/, '');
    return stripped;
  }

  /**
   * Get initialized Gemini client
   */
  private static getGeminiClient(): GoogleGenerativeAI {
    if (!this.geminiClient) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return this.geminiClient;
  }

  /**
   * Execute model request using appropriate API
   */
  static async executeRequest(request: AIModelRequest): Promise<AIModelResponse> {
    const providerInfo = this.getProviderInfo(request.modelName);
    const startTime = Date.now();

    console.log(`🚀 Routing ${request.modelName} to ${providerInfo.name} API`);
    
    let response: AIModelResponse | null = null;
    let error: Error | null = null;

    try {
      if (providerInfo.apiEndpoint === 'gemini') {
        response = await this.executeGeminiRequest(request, startTime);
      } else {
        response = await this.executeOpenRouterRequest(request, startTime);
      }

      // Apply centralized JSON parsing if requested
      if (request.parseResponse) {
        this.applyJsonParsing(response, request);
      }

      // Track analytics (fire-and-forget) for successful requests
      if (request.analytics?.useCaseId) {
        const analyticsData = prepareAnalyticsData(
          response,
          request.modelName,
          request.analytics,
          null
        );
        
        if (analyticsData) {
          // Fire-and-forget: Don't await this operation
          trackAIExecution(analyticsData).catch(err => {
            console.error('📊 Analytics tracking error (non-blocking):', err);
          });
        }
      }

      return response;
    } catch (err) {
      error = err as Error;
      console.error(`❌ ${providerInfo.name} API request failed:`, error);
      
      // Track analytics for failed requests (fire-and-forget)
      if (request.analytics?.useCaseId) {
        const analyticsData = prepareAnalyticsData(
          null,
          request.modelName,
          request.analytics,
          error
        );
        
        if (analyticsData) {
          // Fire-and-forget: Don't await this operation
          trackAIExecution(analyticsData).catch(analyticsErr => {
            console.error('📊 Analytics tracking error (non-blocking):', analyticsErr);
          });
        }
      }
      
      throw error;
    }
  }

  /**
   * Execute request using Gemini API
   */
  private static async executeGeminiRequest(
    request: AIModelRequest, 
    startTime: number
  ): Promise<AIModelResponse> {
    const client = this.getGeminiClient();
    const normalizedModelName = this.normalizeGeminiModelName(request.modelName);

    // Prepare candidate model IDs to try
    const candidates: string[] = Array.from(new Set([
      normalizedModelName,
      normalizedModelName.replace(/-(\d{3})$/, ''),
      normalizedModelName.endsWith('-preview') ? normalizedModelName : `${normalizedModelName}-preview`,
      normalizedModelName.endsWith('-latest') ? normalizedModelName : `${normalizedModelName}-latest`,
    ].filter(Boolean)));

    let lastError: any = null;
    for (const candidate of candidates) {
      try {
        const model = client.getGenerativeModel({ 
          model: candidate,
          generationConfig: {
            temperature: request.configuration?.temperature ?? 0.7,
            maxOutputTokens: request.configuration?.maxTokens ?? 1000,
            topP: request.configuration?.topP ?? 0.9,
            topK: request.configuration?.topK ?? 40,
          }
        });

        // Build the prompt
        let finalPrompt = '';
        if (request.systemPrompt) {
          finalPrompt += `System: ${request.systemPrompt}\n\n`;
        }
        if (request.userPrompt) {
          finalPrompt += `User: ${request.userPrompt}`;
        } else if (request.prompt) {
          finalPrompt += request.prompt;
        }

        // Substitute variables if provided
        if (request.variables) {
          Object.entries(request.variables).forEach(([key, value]) => {
            const patterns = [
              new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'),
              new RegExp(`\\{\\{\\s*\\$${key}\\s*\\}\\}`, 'g')
            ];
            patterns.forEach(pattern => {
              finalPrompt = finalPrompt.replace(pattern, value);
            });
          });
        }

        const result = await model.generateContent(finalPrompt);
        const response = result.response;
        const text = response.text();
        
        const latencyMs = Date.now() - startTime;
        const usage = response.usageMetadata || {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0
        };

        return {
          content: text,
          usage: {
            promptTokens: usage.promptTokenCount || 0,
            completionTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0
          },
          latencyMs,
          finishReason: response.candidates?.[0]?.finishReason || 'stop',
          costUSD: this.calculateGeminiCost(candidate, usage),
          provider: 'gemini'
        };
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.response?.status;
        const message: string = typeof err?.message === 'string' ? err.message : '';
        const is404 = status === 404 || /404/.test(message);
        console.warn(`⚠️ Gemini model '${candidate}' failed${is404 ? ' (404)' : ''}, trying next candidate if available...`);
        if (!is404) {
          break;
        }
      }
    }

    throw lastError || new Error(`Failed to call Gemini model: ${normalizedModelName}`);
  }

  /**
   * Execute request using OpenRouter API
   */
  private static async executeOpenRouterRequest(
    request: AIModelRequest,
    startTime: number
  ): Promise<AIModelResponse> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Build messages array
    const messages: Array<{role: string, content: string}> = [];
    
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    let userContent = request.userPrompt || request.prompt || '';
    
    // Substitute variables if provided
    if (request.variables) {
      Object.entries(request.variables).forEach(([key, value]) => {
        const patterns = [
          new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'),
          new RegExp(`\\{\\{\\s*\\$${key}\\s*\\}\\}`, 'g')
        ];
        patterns.forEach(pattern => {
          userContent = userContent.replace(pattern, value);
        });
      });
    }
    
    messages.push({ role: 'user', content: userContent });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'PrompTick Admin - AI Model Enrichment',
      },
      body: JSON.stringify({
        model: request.modelName,
        messages,
        temperature: request.configuration?.temperature ?? 0.7,
        max_tokens: request.configuration?.maxTokens ?? 1000,
        top_p: request.configuration?.topP ?? 0.9,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    
    const usage = data.usage || {};
    const choice = data.choices?.[0];
    
    if (!choice) {
      throw new Error('No response choices returned from OpenRouter');
    }

    return {
      content: choice.message?.content || '',
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      },
      latencyMs,
      finishReason: choice.finish_reason || 'stop',
      costUSD: this.calculateOpenRouterCost(request.modelName, usage),
      provider: 'openrouter'
    };
  }

  /**
   * Calculate cost for Gemini models
   */
  private static calculateGeminiCost(modelName: string, usage: any): number {
    const pricing = this.getModelPricing(modelName);
    const promptTokens = usage.promptTokenCount || 0;
    const completionTokens = usage.candidatesTokenCount || 0;
    
    return ((promptTokens * pricing.input) + (completionTokens * pricing.output)) / 1_000_000;
  }

  /**
   * Calculate cost for OpenRouter models
   */
  private static calculateOpenRouterCost(modelName: string, usage: any): number {
    const pricing = this.getModelPricing(modelName);
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    
    return ((promptTokens * pricing.input) + (completionTokens * pricing.output)) / 1_000_000;
  }

  /**
   * Get model pricing (per 1M tokens)
   */
  private static getModelPricing(modelName: string): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      // Google AI models
      'gemini-1.5-pro': { input: 0.5, output: 1.5 },
      'gemini-1.5-flash': { input: 0.075, output: 0.3 },
      'gemini-1.0-pro': { input: 0.5, output: 1.5 },
      'gemini-2.0-pro': { input: 1, output: 2 },
      'gemini-2.0-flash': { input: 0.2, output: 0.4 },
      'gemini-2.0-flash-lite-001': { input: 0.05, output: 0.1 },
      'gemini-2.5-pro': { input: 1.5, output: 3 },
      
      // OpenAI models (via OpenRouter)
      'gpt-4': { input: 30, output: 60 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'openai/gpt-4': { input: 30, output: 60 },
      'openai/gpt-4-turbo': { input: 10, output: 30 },
      'openai/gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      
      // Anthropic models (via OpenRouter)
      'claude-3-opus': { input: 15, output: 75 },
      'claude-3-sonnet': { input: 3, output: 15 },
      'claude-3-haiku': { input: 0.25, output: 1.25 },
      'anthropic/claude-3-opus': { input: 15, output: 75 },
      'anthropic/claude-3-sonnet': { input: 3, output: 15 },
      'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
    };
    
    return pricing[modelName] || { input: 1, output: 2 }; // Default fallback
  }

  /**
   * Apply JSON parsing to response content
   */
  private static applyJsonParsing(response: AIModelResponse, request: AIModelRequest): void {
    console.log(`🔍 AIAPIRouter: Attempting JSON parsing for response length: ${response.content.length}`);
    
    try {
      const result = this.extractAndParseJson(response.content, request.strictJsonMode || false);
      
      if (result.success) {
        response.parsedContent = result.data;
        response.parseSuccess = true;
        console.log(`✅ AIAPIRouter: JSON parsing successful`);
      } else {
        response.parseError = result.error;
        response.parseSuccess = false;
        console.log(`⚠️ AIAPIRouter: JSON parsing failed: ${result.error}`);
      }
    } catch (error) {
      response.parseError = error instanceof Error ? error.message : 'Unknown parsing error';
      response.parseSuccess = false;
      console.error(`❌ AIAPIRouter: JSON parsing exception:`, error);
    }
  }

  /**
   * Extract and parse JSON from content using multiple strategies
   */
  private static extractAndParseJson(content: string, strictMode: boolean = false): {
    success: boolean;
    data?: any;
    error?: string;
  } {
    const cleaned = content.trim();
    
    // Strategy 1: Direct JSON parsing
    if (this.isValidJson(cleaned)) {
      return { success: true, data: JSON.parse(cleaned) };
    }
    
    // Strategy 2: Extract from markdown code blocks
    let markdownMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (markdownMatch) {
      const extractedContent = markdownMatch[1].trim();
      if (this.isValidJson(extractedContent)) {
        return { success: true, data: JSON.parse(extractedContent) };
      }
    }
    
    // Strategy 3: Try truncated markdown
    if (cleaned.startsWith('```json') || cleaned.startsWith('```\n')) {
      const jsonStart = cleaned.indexOf('{');
      if (jsonStart !== -1) {
        const extractedContent = cleaned.substring(jsonStart).trim();
        const lastCompleteJson = this.findLastCompleteJsonObject(extractedContent);
        if (lastCompleteJson && this.isValidJson(lastCompleteJson)) {
          return { success: true, data: JSON.parse(lastCompleteJson) };
        }
      }
    }
    
    // Strategy 4: Find largest JSON object
    const largestJson = this.extractLargestJsonObject(cleaned);
    if (largestJson && this.isValidJson(largestJson)) {
      return { success: true, data: JSON.parse(largestJson) };
    }
    
    // Strategy 5: Aggressive cleanup (only if not in strict mode)
    if (!strictMode) {
      const fallbackJson = this.extractJsonWithFallback(cleaned);
      if (fallbackJson && this.isValidJson(fallbackJson)) {
        return { success: true, data: JSON.parse(fallbackJson) };
      }
    }
    
    return { 
      success: false, 
      error: `No valid JSON found in content. Tried ${strictMode ? 4 : 5} extraction strategies.` 
    };
  }

  /**
   * Quick check if string is valid JSON
   */
  private static isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract the largest JSON object from text using brace counting
   */
  private static extractLargestJsonObject(text: string): string | null {
    const openBraces: number[] = [];
    let start = -1;
    let largestJson = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '{') {
        if (openBraces.length === 0) {
          start = i;
        }
        openBraces.push(i);
      } else if (char === '}') {
        openBraces.pop();
        
        if (openBraces.length === 0 && start !== -1) {
          const jsonCandidate = text.slice(start, i + 1);
          if (this.isValidJson(jsonCandidate) && jsonCandidate.length > largestJson.length) {
            largestJson = jsonCandidate;
          }
          start = -1;
        }
      }
    }
    
    return largestJson || null;
  }

  /**
   * Last resort JSON extraction with aggressive cleaning
   */
  private static extractJsonWithFallback(text: string): string | null {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      return null;
    }
    
    const candidate = text.slice(firstBrace, lastBrace + 1);
    
    const fixes = [
      candidate,
      candidate.replace(/,(\s*[}\]])/g, '$1'), // Remove trailing commas
      candidate.replace(/'/g, '"'), // Fix quote issues
      candidate.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '') // Remove comments
    ];
    
    for (const fix of fixes) {
      if (this.isValidJson(fix)) {
        return fix;
      }
    }
    
    return null;
  }

  /**
   * Find the last complete JSON object from potentially truncated content
   */
  private static findLastCompleteJsonObject(text: string): string | null {
    let maxValidJson = '';
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          
          if (braceCount === 0) {
            const candidate = text.substring(0, i + 1);
            if (this.isValidJson(candidate)) {
              maxValidJson = candidate;
            }
          }
        }
      }
    }
    
    return maxValidJson || null;
  }
}

export default AIAPIRouter;