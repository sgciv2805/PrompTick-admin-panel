// Model data seeder for Firestore database
// Seeds comprehensive model and provider data with full prompt guidance

import { adminDb as db } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { ModelDocument, ProviderDocument } from '@/types/model-schema';

export class ModelDataSeeder {
  
  /**
   * Seed all providers and models with comprehensive data
   */
  static async seedAll(): Promise<void> {
    console.log('🌱 Starting model database seeding...');
    
    try {
      await this.seedProviders();
      await this.seedModels();
      console.log('✅ Model database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Model database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed provider data
   */
  private static async seedProviders(): Promise<void> {
    const batch = db.batch();
    const providers = this.getProviderData();

    providers.forEach(provider => {
      const providerRef = db.collection('providers').doc(provider.id);
      batch.set(providerRef, {
        ...provider,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`✅ Seeded ${providers.length} providers`);
  }

  /**
   * Seed model data with comprehensive prompt guidance
   */
  private static async seedModels(): Promise<void> {
    const models = this.getModelData();
    
    // Process in batches of 10 (Firestore batch limit is 500)
    const batchSize = 10;
    for (let i = 0; i < models.length; i += batchSize) {
      const batch = db.batch();
      const modelBatch = models.slice(i, i + batchSize);
      
      modelBatch.forEach(model => {
        const modelRef = db.collection('models').doc(model.id);
        batch.set(modelRef, {
          ...model,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`✅ Seeded batch ${Math.floor(i / batchSize) + 1}: ${modelBatch.length} models`);
    }
    
    console.log(`✅ Seeded ${models.length} models total`);
  }

  /**
   * Get provider data
   */
  private static getProviderData(): Omit<ProviderDocument, 'createdAt' | 'updatedAt'>[] {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        displayName: 'OpenAI',
        website: 'https://openai.com',
        apiBaseUrl: 'https://api.openai.com/v1',
        authTypes: ['api-key'],
        supportLevels: ['enterprise', 'business', 'developer'],
        reliability: 95,
        defaultSettings: {
          rateLimit: 60,
          timeout: 30000,
          retryStrategy: 'exponential-backoff'
        },
        isActive: true,
        lastStatusCheck: Timestamp.now(),
        tags: ['llm', 'multimodal', 'code', 'leading'],
        description: 'Leading AI research company known for GPT models and ChatGPT'
      },

      {
        id: 'anthropic',
        name: 'Anthropic',
        displayName: 'Anthropic',
        website: 'https://anthropic.com',
        apiBaseUrl: 'https://api.anthropic.com/v1',
        authTypes: ['api-key'],
        supportLevels: ['enterprise', 'business', 'developer'],
        reliability: 94,
        defaultSettings: {
          rateLimit: 50,
          timeout: 30000,
          retryStrategy: 'exponential-backoff'
        },
        isActive: true,
        lastStatusCheck: Timestamp.now(),
        tags: ['llm', 'safe', 'reasoning', 'helpful'],
        description: 'AI safety-focused company creating helpful, harmless, and honest AI systems'
      },

      {
        id: 'google',
        name: 'Google',
        displayName: 'Google AI',
        website: 'https://ai.google',
        apiBaseUrl: 'https://generativelanguage.googleapis.com/v1',
        authTypes: ['api-key', 'service-account'],
        supportLevels: ['enterprise', 'business', 'developer'],
        reliability: 92,
        defaultSettings: {
          rateLimit: 60,
          timeout: 30000,
          retryStrategy: 'exponential-backoff'
        },
        isActive: true,
        lastStatusCheck: Timestamp.now(),
        tags: ['llm', 'multimodal', 'long-context', 'multilingual'],
        description: 'Google\'s advanced AI models with massive context windows and multimodal capabilities'
      }
    ];
  }

  /**
   * Get comprehensive model data with full prompt guidance
   */
  private static getModelData(): Omit<ModelDocument, 'createdAt' | 'updatedAt'>[] {
    return [
      // OpenAI GPT-4o
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        providerId: 'openai',
        fullModelPath: 'openai/gpt-4o',
        
        specifications: {
          version: '2024-11-20',
          releaseDate: Timestamp.fromDate(new Date('2024-05-13')),
          trainingCutoff: '2024-04',
          architecture: 'transformer'
        },
        
        capabilities: {
          supportsImages: true,
          supportsCodeExecution: false,
          supportsFunctionCalling: true,
          supportsStreaming: true,
          supportsVision: true,
          supportsAudio: false,
          supportedFormats: ['text', 'json', 'markdown', 'code', 'xml'],
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'],
          maxTokens: 4096,
          contextWindow: 128000,
          specialFeatures: ['multimodal', 'function-calling', 'json-mode']
        },
        
        performance: {
          qualityTier: 5,
          speedTier: 3,
          costTier: 4,
          reliabilityScore: 95,
          averageLatencyMs: 2000,
          throughputRequestsPerMin: 500,
          benchmarks: {
            mmlu: 87.2,
            hellaswag: 89.1,
            humanEval: 87.2,
            gsm8k: 92.3,
            lastUpdated: Timestamp.now()
          }
        },
        
        pricing: {
          inputTokenCost: 0.005,
          outputTokenCost: 0.015,
          imageInputCost: 0.00425,
          currency: 'USD',
          source: 'manual',
          lastUpdated: Timestamp.now(),
          isVerified: true,
          priceHistory: [
            {
              date: Timestamp.fromDate(new Date('2024-11-01')),
              inputCost: 0.005,
              outputCost: 0.015
            }
          ]
        },
        
        promptGuidance: {
          structure: {
            preferredFormat: 'system-user',
            systemPromptStyle: 'directive',
            maxSystemPromptLength: 4000,
            maxUserPromptLength: 120000,
            supportsRoleBasedPrompts: true,
            preferredRoles: ['system', 'user', 'assistant', 'function']
          },
          
          communicationStyle: {
            tone: ['technical', 'formal', 'detailed'],
            clarity: 'explicit',
            verbosity: 'balanced',
            instructionStyle: 'step-by-step'
          },
          
          optimizationTechniques: {
            effectiveTechniques: [
              'chain-of-thought',
              'few-shot',
              'step-by-step',
              'constraint-specification',
              'format-specification'
            ],
            avoidTechniques: [
              'complex-nesting',
              'contradictory-instructions',
              'excessive-examples'
            ],
            preferredFormats: {
              lists: 'numbered',
              code: 'fenced',
              data: 'json',
              reasoning: 'step-by-step'
            }
          },
          
          contextHandling: {
            maxEffectiveContextLength: 100000,
            contextPlacement: 'structured',
            exampleCount: { min: 1, max: 5, optimal: 3 },
            examplePlacement: 'before-instruction',
            contextCompressionTolerance: 'high'
          },
          
          taskSpecificGuidance: {
            'code-generation': {
              promptTemplates: [
                'You are an expert programmer. Write {language} code that {task}. Follow these requirements: {requirements}',
                'Create a {language} function that {functionality}. Include error handling and documentation.'
              ],
              keyPhrases: ['step by step', 'include comments', 'error handling', 'best practices'],
              avoidPhrases: ['quickly', 'simple', 'basic'],
              examples: [
                {
                  scenario: 'API endpoint creation',
                  goodPrompt: 'Create a Python FastAPI endpoint that accepts user registration data, validates email format, hashes passwords, and returns appropriate HTTP status codes with error messages.',
                  whyItWorks: 'Specific requirements, mentions validation and security, clear expected behavior',
                  expectedOutput: 'Complete FastAPI endpoint with validation, error handling, and security best practices'
                }
              ],
              specificInstructions: [
                'Always specify the programming language',
                'Include error handling requirements',
                'Ask for documentation/comments',
                'Specify coding standards if needed'
              ]
            },
            
            'content-creation': {
              promptTemplates: [
                'Write {content_type} for {audience} about {topic}. Tone: {tone}. Length: {length}.',
                'Create {content_type} that {objective}. Style: {style}. Include: {requirements}.'
              ],
              keyPhrases: ['target audience', 'tone', 'call to action', 'key points'],
              avoidPhrases: ['whatever', 'generic', 'standard'],
              examples: [
                {
                  scenario: 'Marketing blog post',
                  goodPrompt: 'Write a 800-word blog post for small business owners about email marketing automation. Use a friendly, encouraging tone. Include 3 specific benefits, 2 tool recommendations, and end with a clear call to action.',
                  whyItWorks: 'Specific length, clear audience, defined tone, concrete deliverables',
                  expectedOutput: 'Well-structured blog post with specific word count and required elements'
                }
              ],
              specificInstructions: [
                'Always define the target audience',
                'Specify desired tone and style',
                'Include length or structural requirements',
                'Ask for specific elements (CTA, examples, etc.)'
              ]
            }
          },
          
          variableHandling: {
            preferredVariableSyntax: { before: '{{', after: '}}' },
            variablePlacement: 'inline',
            maxVariables: 20,
            complexVariableSupport: true,
            variableNaming: 'snake_case'
          },
          
          reliabilityNotes: {
            consistentAt: ['reasoning', 'code generation', 'analysis', 'following instructions'],
            inconsistentAt: ['creative writing consistency', 'factual accuracy for recent events'],
            commonFailureModes: ['hallucinating recent information', 'over-explaining simple tasks'],
            mitigationStrategies: [
              'Use explicit instructions for factual accuracy',
              'Specify conciseness when needed',
              'Provide context for recent events'
            ],
            temperatureRecommendations: {
              creative: 0.7,
              analytical: 0.1,
              factual: 0.0,
              conversational: 0.3
            }
          }
        },
        
        workflowIntegration: {
          defaultStrategy: 'instruction-focused',
          webhookEnhancements: {
            includeModelGuidance: true,
            guidanceFields: ['structure', 'communicationStyle', 'optimizationTechniques'],
            customInstructions: 'Use structured prompts with clear instructions. Include examples when helpful.',
            preferredWorkflowType: 'generation'
          },
          testingConsiderations: {
            recommendedTestTypes: ['functionality', 'accuracy', 'consistency'],
            evaluationCriteria: ['instruction_following', 'output_quality', 'format_compliance'],
            knownTestingChallenges: ['factual_accuracy_recent_events', 'creative_consistency'],
            optimalTestPromptLength: 500
          }
        },
        
        categories: ['flagship', 'multimodal', 'reasoning'],
        strengths: ['reasoning', 'analysis', 'coding', 'multimodal', 'instruction-following'],
        idealUseCases: ['complex-analysis', 'coding', 'research', 'technical-documentation', 'multimodal-tasks'],
        industries: ['technology', 'finance', 'healthcare', 'education', 'general'],
        
        tags: ['gpt', 'multimodal', 'premium', 'reasoning', 'latest'],
        description: 'Most capable multimodal model with excellent reasoning, coding, and analysis capabilities. Ideal for complex tasks requiring high-quality outputs.',
        
        status: 'active',
        availability: {
          regions: ['us', 'eu', 'asia'],
          accessLevel: 'public',
          requiresApproval: false,
          waitlist: false
        },
        
        dataSource: {
          scrapedFrom: ['https://openai.com/api/pricing'],
          lastSuccessfulUpdate: Timestamp.now(),
          updateFrequency: 'daily',
          failureCount: 0,
          dataQuality: 'estimated',
          verificationMethod: 'api'
        }
      },

      // OpenAI GPT-4o Mini
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        providerId: 'openai',
        fullModelPath: 'openai/gpt-4o-mini',
        
        specifications: {
          version: '2024-07-18',
          releaseDate: Timestamp.fromDate(new Date('2024-07-18')),
          trainingCutoff: '2024-04',
          architecture: 'transformer'
        },
        
        capabilities: {
          supportsImages: true,
          supportsCodeExecution: false,
          supportsFunctionCalling: true,
          supportsStreaming: true,
          supportsVision: true,
          supportsAudio: false,
          supportedFormats: ['text', 'json', 'markdown', 'code'],
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          maxTokens: 16384,
          contextWindow: 128000,
          specialFeatures: ['multimodal', 'function-calling', 'cost-effective']
        },
        
        performance: {
          qualityTier: 4,
          speedTier: 5,
          costTier: 2,
          reliabilityScore: 90,
          averageLatencyMs: 1200,
          throughputRequestsPerMin: 1000,
          benchmarks: {
            mmlu: 82.0,
            hellaswag: 85.2,
            humanEval: 75.0,
            gsm8k: 87.0,
            lastUpdated: Timestamp.now()
          }
        },
        
        pricing: {
          inputTokenCost: 0.00015,
          outputTokenCost: 0.0006,
          imageInputCost: 0.00425,
          currency: 'USD',
          source: 'manual',
          lastUpdated: Timestamp.now(),
          isVerified: true
        },
        
        promptGuidance: {
          structure: {
            preferredFormat: 'conversation',
            systemPromptStyle: 'persona',
            maxSystemPromptLength: 2000,
            maxUserPromptLength: 120000,
            supportsRoleBasedPrompts: true,
            preferredRoles: ['system', 'user', 'assistant']
          },
          
          communicationStyle: {
            tone: ['casual', 'friendly', 'concise'],
            clarity: 'explicit',
            verbosity: 'concise',
            instructionStyle: 'conversational'
          },
          
          optimizationTechniques: {
            effectiveTechniques: [
              'few-shot',
              'template-filling',
              'constraint-specification'
            ],
            avoidTechniques: [
              'very-long-context',
              'complex-nesting'
            ],
            preferredFormats: {
              lists: 'bulleted',
              code: 'fenced',
              data: 'json',
              reasoning: 'conclusion-first'
            }
          },
          
          contextHandling: {
            maxEffectiveContextLength: 80000,
            contextPlacement: 'beginning',
            exampleCount: { min: 1, max: 3, optimal: 2 },
            examplePlacement: 'before-instruction',
            contextCompressionTolerance: 'medium'
          },
          
          taskSpecificGuidance: {
            'content-creation': {
              promptTemplates: [
                'Create {content_type} about {topic}. Keep it {tone} and {length}.',
                'Write {content_type} for {audience}. Focus on {key_points}.'
              ],
              keyPhrases: ['concise', 'engaging', 'clear', 'actionable'],
              avoidPhrases: ['verbose', 'complex', 'technical'],
              examples: [
                {
                  scenario: 'Social media post',
                  goodPrompt: 'Write a friendly Instagram post about remote work benefits. Keep it under 150 words with 3 key benefits and 2 relevant hashtags.',
                  whyItWorks: 'Clear format, specific length, concrete deliverables, appropriate tone',
                  expectedOutput: 'Concise, engaging social media post with specified elements'
                }
              ],
              specificInstructions: [
                'Keep instructions simple and clear',
                'Specify length constraints',
                'Use friendly, conversational tone',
                'Focus on practical outcomes'
              ]
            },
            
            'customer-support': {
              promptTemplates: [
                'Help answer this customer question: {question}. Be {tone} and provide {solution_type}.',
                'Create a customer service response for {situation}. Include {elements}.'
              ],
              keyPhrases: ['helpful', 'empathetic', 'solution-focused', 'clear steps'],
              avoidPhrases: ['complex', 'technical jargon', 'lengthy'],
              examples: [
                {
                  scenario: 'Product return request',
                  goodPrompt: 'Write a helpful customer service response to someone requesting a product return. Be empathetic, explain the process in 3 simple steps, and offer additional assistance.',
                  whyItWorks: 'Clear tone direction, specific structure, focuses on customer experience',
                  expectedOutput: 'Empathetic response with clear return process steps'
                }
              ],
              specificInstructions: [
                'Always specify empathetic tone',
                'Break solutions into clear steps',
                'Keep responses concise',
                'Offer additional help'
              ]
            }
          },
          
          variableHandling: {
            preferredVariableSyntax: { before: '{', after: '}' },
            variablePlacement: 'inline',
            maxVariables: 10,
            complexVariableSupport: false,
            variableNaming: 'natural-language'
          },
          
          reliabilityNotes: {
            consistentAt: ['simple tasks', 'content creation', 'customer support', 'summarization'],
            inconsistentAt: ['complex reasoning', 'technical accuracy', 'long-form content'],
            commonFailureModes: ['oversimplifying complex topics', 'missing nuance in detailed analysis'],
            mitigationStrategies: [
              'Keep tasks focused and specific',
              'Provide clear examples',
              'Use simple language in prompts'
            ],
            temperatureRecommendations: {
              creative: 0.6,
              analytical: 0.2,
              factual: 0.1,
              conversational: 0.4
            }
          }
        },
        
        workflowIntegration: {
          defaultStrategy: 'conversation-style',
          webhookEnhancements: {
            includeModelGuidance: true,
            guidanceFields: ['communicationStyle', 'taskSpecificGuidance'],
            customInstructions: 'Use conversational prompts with clear, simple instructions.',
            preferredWorkflowType: 'generation'
          },
          testingConsiderations: {
            recommendedTestTypes: ['functionality', 'tone', 'length'],
            evaluationCriteria: ['helpfulness', 'clarity', 'conciseness'],
            knownTestingChallenges: ['complex_reasoning', 'technical_accuracy'],
            optimalTestPromptLength: 200
          }
        },
        
        categories: ['efficient', 'fast', 'multimodal'],
        strengths: ['speed', 'cost-efficiency', 'conversation', 'content-creation'],
        idealUseCases: ['content-creation', 'customer-support', 'simple-analysis', 'conversation'],
        industries: ['customer-service', 'marketing', 'e-commerce', 'general'],
        
        tags: ['gpt', 'mini', 'fast', 'economical', 'conversation'],
        description: 'Fast and cost-effective model perfect for everyday tasks, content creation, and customer interactions.',
        
        status: 'active',
        availability: {
          regions: ['us', 'eu', 'asia'],
          accessLevel: 'public',
          requiresApproval: false,
          waitlist: false
        },
        
        dataSource: {
          scrapedFrom: ['https://openai.com/api/pricing'],
          lastSuccessfulUpdate: Timestamp.now(),
          updateFrequency: 'daily',
          failureCount: 0,
          dataQuality: 'estimated',
          verificationMethod: 'api'
        }
      },

      // Anthropic Claude 3.5 Sonnet
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        providerId: 'anthropic',
        fullModelPath: 'anthropic/claude-3-5-sonnet',
        
        specifications: {
          version: '20241022',
          releaseDate: Timestamp.fromDate(new Date('2024-10-22')),
          trainingCutoff: '2024-04',
          architecture: 'transformer'
        },
        
        capabilities: {
          supportsImages: true,
          supportsCodeExecution: false,
          supportsFunctionCalling: true,
          supportsStreaming: true,
          supportsVision: true,
          supportsAudio: false,
          supportedFormats: ['text', 'json', 'markdown', 'code', 'xml'],
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
          maxTokens: 4096,
          contextWindow: 200000,
          specialFeatures: ['large-context', 'reasoning', 'safety-focused']
        },
        
        performance: {
          qualityTier: 5,
          speedTier: 4,
          costTier: 3,
          reliabilityScore: 94,
          averageLatencyMs: 1800,
          throughputRequestsPerMin: 400,
          benchmarks: {
            mmlu: 88.7,
            hellaswag: 89.0,
            humanEval: 92.0,
            gsm8k: 95.0,
            lastUpdated: Timestamp.now()
          }
        },
        
        pricing: {
          inputTokenCost: 0.003,
          outputTokenCost: 0.015,
          imageInputCost: 0.0048,
          currency: 'USD',
          source: 'provider-website',
          lastUpdated: Timestamp.now(),
          isVerified: true
        },
        
        promptGuidance: {
          structure: {
            preferredFormat: 'conversation',
            systemPromptStyle: 'context',
            maxSystemPromptLength: 10000,
            maxUserPromptLength: 180000,
            supportsRoleBasedPrompts: true,
            preferredRoles: ['system', 'user', 'assistant']
          },
          
          communicationStyle: {
            tone: ['thoughtful', 'nuanced', 'detailed', 'careful'],
            clarity: 'explicit',
            verbosity: 'detailed',
            instructionStyle: 'example-driven'
          },
          
          optimizationTechniques: {
            effectiveTechniques: [
              'chain-of-thought',
              'reasoning-aloud',
              'example-demonstration',
              'step-by-step'
            ],
            avoidTechniques: [
              'contradictory-instructions',
              'unclear-formatting'
            ],
            preferredFormats: {
              lists: 'structured',
              code: 'commented',
              data: 'xml',
              reasoning: 'explicit'
            }
          },
          
          contextHandling: {
            maxEffectiveContextLength: 180000,
            contextPlacement: 'structured',
            exampleCount: { min: 2, max: 8, optimal: 4 },
            examplePlacement: 'mixed',
            contextCompressionTolerance: 'high'
          },
          
          taskSpecificGuidance: {
            'analysis': {
              promptTemplates: [
                'Analyze {subject} by examining {aspects}. Consider {perspectives} and provide {output_format}.',
                'Perform a thorough analysis of {topic}. Break down {components} and explain {relationships}.'
              ],
              keyPhrases: ['thorough analysis', 'consider multiple perspectives', 'step by step reasoning', 'evidence-based'],
              avoidPhrases: ['quickly', 'simple overview', 'basic'],
              examples: [
                {
                  scenario: 'Business strategy analysis',
                  goodPrompt: 'Analyze the competitive landscape for electric vehicle manufacturers. Examine market share, technological advantages, regulatory environment, and consumer trends. Consider both established automakers and new entrants. Provide a detailed assessment with supporting evidence.',
                  whyItWorks: 'Specific scope, multiple analysis dimensions, requests evidence, comprehensive approach',
                  expectedOutput: 'Detailed analysis with multiple perspectives and evidence-based conclusions'
                }
              ],
              specificInstructions: [
                'Always request thorough analysis',
                'Ask for evidence and reasoning',
                'Specify multiple perspectives to consider',
                'Request structured output format'
              ]
            },
            
            'coding': {
              promptTemplates: [
                'Write {language} code for {task}. Follow best practices for {aspects}. Include {requirements}.',
                'Develop a {type} solution that {functionality}. Consider {constraints} and optimize for {goals}.'
              ],
              keyPhrases: ['best practices', 'clean code', 'error handling', 'documentation', 'optimization'],
              avoidPhrases: ['quick and dirty', 'simple solution', 'basic implementation'],
              examples: [
                {
                  scenario: 'Database query optimization',
                  goodPrompt: 'Write a Python function to optimize database queries for a user analytics system. Include connection pooling, query caching, error handling, and logging. Follow PEP 8 standards and include comprehensive docstrings.',
                  whyItWorks: 'Specific technical requirements, mentions best practices, includes quality standards',
                  expectedOutput: 'Well-documented, optimized code following best practices'
                }
              ],
              specificInstructions: [
                'Always mention best practices',
                'Request comprehensive error handling',
                'Ask for documentation and comments',
                'Specify coding standards when relevant'
              ]
            }
          },
          
          variableHandling: {
            preferredVariableSyntax: { before: '{{', after: '}}' },
            variablePlacement: 'structured',
            maxVariables: 25,
            complexVariableSupport: true,
            variableNaming: 'descriptive-natural'
          },
          
          reliabilityNotes: {
            consistentAt: ['reasoning', 'analysis', 'coding', 'nuanced understanding', 'safety'],
            inconsistentAt: ['creative fiction', 'highly technical specialized domains'],
            commonFailureModes: ['over-cautious responses', 'verbose explanations when brevity needed'],
            mitigationStrategies: [
              'Explicitly request conciseness when needed',
              'Provide clear guidelines for response tone',
              'Use examples to show desired output style'
            ],
            temperatureRecommendations: {
              creative: 0.8,
              analytical: 0.2,
              factual: 0.0,
              conversational: 0.4
            }
          }
        },
        
        workflowIntegration: {
          defaultStrategy: 'example-driven',
          webhookEnhancements: {
            includeModelGuidance: true,
            guidanceFields: ['structure', 'optimizationTechniques', 'taskSpecificGuidance'],
            customInstructions: 'Use detailed prompts with examples. Claude works best with comprehensive context.',
            preferredWorkflowType: 'analysis'
          },
          testingConsiderations: {
            recommendedTestTypes: ['accuracy', 'reasoning', 'safety'],
            evaluationCriteria: ['logical_consistency', 'depth_of_analysis', 'safety_compliance'],
            knownTestingChallenges: ['response_length', 'over_cautious_responses'],
            optimalTestPromptLength: 800
          }
        },
        
        categories: ['flagship', 'reasoning', 'coding', 'analysis'],
        strengths: ['reasoning', 'analysis', 'coding', 'safety', 'nuanced-understanding'],
        idealUseCases: ['analysis', 'coding', 'research', 'technical-documentation', 'complex-reasoning'],
        industries: ['technology', 'finance', 'legal', 'academia', 'healthcare'],
        
        tags: ['claude', 'reasoning', 'safe', 'premium', 'analysis'],
        description: 'Most intelligent Claude model with exceptional reasoning, coding, and analysis capabilities. Prioritizes safety and nuanced understanding.',
        
        status: 'active',
        availability: {
          regions: ['us', 'eu'],
          accessLevel: 'public',
          requiresApproval: false,
          waitlist: false
        },
        
        dataSource: {
          scrapedFrom: ['https://www.anthropic.com/api', 'https://docs.anthropic.com/claude/docs/models-overview'],
          lastSuccessfulUpdate: Timestamp.now(),
          updateFrequency: 'weekly',
          failureCount: 0,
          dataQuality: 'estimated',
          verificationMethod: 'manual'
        }
      }
    ];
  }

  /**
   * Seed specific models only (for testing)
   */
  static async seedSpecificModels(modelIds: string[]): Promise<void> {
    const allModels = this.getModelData();
    const modelsToSeed = allModels.filter(model => modelIds.includes(model.id));
    
    if (modelsToSeed.length === 0) {
      throw new Error(`No models found with IDs: ${modelIds.join(', ')}`);
    }
    
    const batch = db.batch();
    modelsToSeed.forEach(model => {
      const modelRef = db.collection('models').doc(model.id);
      batch.set(modelRef, {
        ...model,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`✅ Seeded ${modelsToSeed.length} specific models`);
  }

  /**
   * Update existing model data (preserves existing fields)
   */
  static async updateModelData(modelId: string, updates: Partial<ModelDocument>): Promise<void> {
    const modelRef = db.collection('models').doc(modelId);
    const updateData = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await modelRef.update(updateData);
    console.log(`✅ Updated model: ${modelId}`);
  }
}