# N8N Workflow 2: AI-Powered Model Enrichment - Detailed Instructions

## Overview
Create an N8N workflow that fetches existing models from Firestore database and enriches them with comprehensive data using AI research (Gemini/Perplexity). This workflow adds detailed prompt guidance, performance insights, and comprehensive metadata.

## Workflow Requirements

### 1. Trigger
- **Node Type**: Manual Trigger (run on-demand)
- **Alternative**: Schedule Trigger (monthly)
- **Purpose**: Allow selective enrichment of models

### 2. Database Query
- **Node Type**: Google Firebase Cloud Firestore
- **Operation**: Read/List documents
- **Collection**: `models`
- **Filter**: Models with `dataQuality: 'basic'` (from Workflow 1)
- **Limit**: Process 10 models per run (to control AI costs)

### 3. AI Research Pipeline
For each model, perform research using multiple AI services:

#### 3.1 Primary Research (Gemini)
- **Node Type**: HTTP Request
- **API**: Google Gemini API
- **Model**: `gemini-1.5-flash` (cost-effective)
- **Purpose**: Research comprehensive model information

#### 3.2 Validation Research (Perplexity) - Optional
- **Node Type**: HTTP Request  
- **API**: Perplexity API
- **Model**: `llama-3.1-sonar-small-128k-online`
- **Purpose**: Cross-validate critical findings

### 4. Data Processing & Quality Control
- **Node Type**: Function
- **Purpose**: Parse AI responses, validate data, assign confidence scores

### 5. Database Update
- **Node Type**: Google Firebase Cloud Firestore
- **Operation**: Update document
- **Collection**: `models`
- **Strategy**: Merge with existing data, preserve basic info from Workflow 1

## AI Research Prompts

### Gemini Research Prompt Template
```
Research the AI model "{model_name}" by {provider_name}. I need comprehensive information formatted as JSON with the following structure:

{
  "useCaseAnalysis": {
    "idealUseCases": ["array of specific use cases"],
    "strengths": ["array of key strengths"],
    "industries": ["array of industry applications"],
    "limitations": ["array of known limitations"]
  },
  
  "promptOptimization": {
    "bestPractices": ["array of prompt engineering tips"],
    "effectiveTechniques": ["array of proven techniques"],
    "avoidTechniques": ["array of techniques to avoid"],
    "temperatureRecommendations": {
      "creative": 0.7,
      "analytical": 0.3,
      "factual": 0.1,
      "conversational": 0.5
    },
    "examplePrompts": [
      {
        "useCase": "coding",
        "prompt": "example prompt",
        "explanation": "why this works well"
      }
    ]
  },
  
  "performanceInsights": {
    "benchmarkResults": ["array of benchmark scores with sources"],
    "userFeedback": ["array of common user experiences"],
    "reliabilityAssessment": {
      "consistentAt": ["tasks it handles consistently"],
      "inconsistentAt": ["tasks with variable performance"],
      "commonFailures": ["known failure modes"]
    }
  },
  
  "technicalDetails": {
    "actualVersion": "if known",
    "releaseDate": "YYYY-MM-DD if known",
    "trainingCutoff": "if known",
    "specialCapabilities": ["unique features"],
    "languageSupport": ["supported languages"],
    "contextHandling": {
      "effectiveLength": "actual usable context length",
      "recommendations": "context usage tips"
    }
  },
  
  "sources": ["array of URLs/sources used"],
  "confidence": "high/medium/low",
  "lastResearched": "current date"
}

Important:
1. Only include factual information you can verify
2. Mark uncertain information with lower confidence
3. Include sources for all claims
4. Focus on practical, actionable insights
5. If information is not available, say "unknown" rather than guessing
```

### Perplexity Validation Prompt Template
```
Verify and expand on these key claims about the AI model "{model_name}":

1. Ideal use cases: {extracted_use_cases}
2. Performance benchmarks: {extracted_benchmarks} 
3. Key strengths: {extracted_strengths}
4. Known limitations: {extracted_limitations}

Please provide:
- Verification of each claim with sources
- Additional insights not mentioned
- Any contradictory information found
- Confidence level for each piece of information

Format response as JSON with sources.
```

## Required Output Schema Enhancement

The workflow should enhance the existing model document with these additional/updated fields:

### Enhanced Performance Section
```json
"performance": {
  "qualityTier": 4,
  "speedTier": 4, 
  "costTier": 4,
  "reliabilityScore": 85,
  "averageLatencyMs": 1800,
  "throughputRequestsPerMin": 120,
  "benchmarks": {
    "mmlu": 87.2,
    "hellaswag": 89.1,
    "humanEval": 85.0,
    "gsm8k": 92.3,
    "lastUpdated": "2024-07-30T18:00:00.000Z"
  }
}
```

### Enhanced Prompt Guidance Section
```json
"promptGuidance": {
  "structure": {
    "preferredFormat": "system-user",
    "systemPromptStyle": "directive", 
    "maxSystemPromptLength": 4000,
    "maxUserPromptLength": 120000,
    "supportsRoleBasedPrompts": true,
    "preferredRoles": ["system", "user", "assistant"]
  },
  
  "communicationStyle": {
    "tone": ["technical", "formal", "detailed"],
    "clarity": "explicit",
    "verbosity": "balanced", 
    "instructionStyle": "step-by-step"
  },
  
  "optimizationTechniques": {
    "effectiveTechniques": [
      "chain-of-thought",
      "few-shot", 
      "step-by-step",
      "constraint-specification"
    ],
    "avoidTechniques": [
      "complex-nesting",
      "contradictory-instructions"
    ],
    "preferredFormats": {
      "lists": "numbered",
      "code": "fenced", 
      "data": "json",
      "reasoning": "step-by-step"
    }
  },
  
  "contextHandling": {
    "maxEffectiveContextLength": 100000,
    "contextPlacement": "structured",
    "exampleCount": {"min": 1, "max": 5, "optimal": 3},
    "examplePlacement": "before-instruction",
    "contextCompressionTolerance": "high"
  },
  
  "taskSpecificGuidance": {
    "coding": {
      "promptTemplates": [
        "You are an expert programmer. Write {language} code that {task}. Include error handling and documentation."
      ],
      "keyPhrases": ["step by step", "error handling", "best practices"],
      "avoidPhrases": ["quickly", "simple"],
      "examples": [
        {
          "scenario": "API endpoint creation",
          "goodPrompt": "Create a Python FastAPI endpoint that accepts user data, validates email format, and returns appropriate HTTP status codes.",
          "whyItWorks": "Specific requirements, mentions validation, clear expected behavior"
        }
      ],
      "specificInstructions": [
        "Always specify the programming language",
        "Include error handling requirements",
        "Ask for documentation/comments"
      ]
    },
    
    "analysis": {
      "promptTemplates": [
        "Analyze {subject} by examining {aspects}. Consider {perspectives} and provide {output_format}."
      ],
      "keyPhrases": ["thorough analysis", "multiple perspectives", "evidence-based"],
      "avoidPhrases": ["quickly", "simple overview"],
      "examples": [],
      "specificInstructions": [
        "Always request thorough analysis", 
        "Ask for evidence and reasoning",
        "Specify multiple perspectives to consider"
      ]
    }
  },
  
  "reliabilityNotes": {
    "consistentAt": ["reasoning", "code generation", "analysis"],
    "inconsistentAt": ["creative writing consistency"],
    "commonFailureModes": ["hallucinating recent information"],
    "mitigationStrategies": [
      "Use explicit instructions",
      "Provide context",
      "Specify output format clearly"
    ],
    "temperatureRecommendations": {
      "creative": 0.7,
      "analytical": 0.1, 
      "factual": 0.0,
      "conversational": 0.3
    }
  }
}
```

### Enhanced Workflow Integration Section
```json
"workflowIntegration": {
  "defaultStrategy": "instruction-focused",
  "webhookEnhancements": {
    "includeModelGuidance": true,
    "guidanceFields": ["structure", "communicationStyle", "optimizationTechniques"],
    "customInstructions": "Use structured prompts with clear instructions. Include examples when helpful.",
    "preferredWorkflowType": "generation"
  },
  "testingConsiderations": {
    "recommendedTestTypes": ["functionality", "accuracy", "consistency"],
    "evaluationCriteria": ["instruction_following", "output_quality", "format_compliance"],
    "knownTestingChallenges": ["factual_accuracy_recent_events"],
    "optimalTestPromptLength": 500
  }
}
```

### Enhanced Categories and Use Cases
```json
"categories": ["flagship", "multimodal", "reasoning"],
"strengths": ["reasoning", "analysis", "coding", "multimodal", "instruction-following"],
"idealUseCases": ["complex-analysis", "coding", "research", "technical-documentation", "multimodal-tasks"],
"industries": ["technology", "finance", "healthcare", "education", "legal"]
```

### Data Quality Tracking
```json
"dataSource": {
  "scrapedFrom": [
    "https://openrouter.ai/api/v1/models",
    "https://openai.com/api/pricing",
    "gemini-research-2024-07-30"
  ],
  "lastSuccessfulUpdate": "2024-07-30T18:00:00.000Z",
  "updateFrequency": "monthly",
  "failureCount": 0,
  "dataQuality": "enriched",
  "verificationMethod": "ai-research",
  "confidenceScore": 85,
  "researchSources": ["official-docs", "benchmarks", "user-feedback"],
  "lastEnriched": "2024-07-30T18:00:00.000Z"
}
```

## Data Processing Logic

### 1. AI Response Parsing
```javascript
function parseAIResponse(response, modelName) {
  try {
    const data = JSON.parse(response);
    
    // Validate required fields
    if (!data.useCaseAnalysis || !data.promptOptimization) {
      throw new Error('Missing required sections in AI response');
    }
    
    // Add metadata
    data.processedAt = new Date();
    data.modelName = modelName;
    data.aiProvider = 'gemini';
    
    return data;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
}
```

### 2. Confidence Scoring
```javascript
function calculateConfidenceScore(aiData) {
  let score = 0;
  
  // Source quality
  if (aiData.sources && aiData.sources.length > 0) score += 30;
  
  // Data completeness
  if (aiData.useCaseAnalysis?.idealUseCases?.length > 0) score += 20;
  if (aiData.promptOptimization?.bestPractices?.length > 0) score += 20;
  if (aiData.performanceInsights?.benchmarkResults?.length > 0) score += 15;
  if (aiData.technicalDetails?.actualVersion !== 'unknown') score += 15;
  
  return Math.min(score, 100);
}
```

### 3. Data Merging Strategy
```javascript
function mergeEnrichmentData(existingModel, aiData) {
  // Preserve basic data from Workflow 1
  const enhanced = { ...existingModel };
  
  // Update categories and use cases
  if (aiData.useCaseAnalysis) {
    enhanced.idealUseCases = aiData.useCaseAnalysis.idealUseCases || enhanced.idealUseCases;
    enhanced.strengths = aiData.useCaseAnalysis.strengths || enhanced.strengths;
    enhanced.industries = aiData.useCaseAnalysis.industries || enhanced.industries;
  }
  
  // Enhance prompt guidance
  if (aiData.promptOptimization) {
    enhanced.promptGuidance = enhancePromptGuidance(
      enhanced.promptGuidance, 
      aiData.promptOptimization
    );
  }
  
  // Update performance data
  if (aiData.performanceInsights) {
    enhanced.performance = enhancePerformanceData(
      enhanced.performance,
      aiData.performanceInsights
    );
  }
  
  // Update data source tracking
  enhanced.dataSource.dataQuality = 'enriched';
  enhanced.dataSource.lastEnriched = new Date();
  enhanced.dataSource.confidenceScore = calculateConfidenceScore(aiData);
  enhanced.updatedAt = new Date();
  
  return enhanced;
}
```

## Error Handling & Quality Control

### 1. API Failure Handling
- Retry failed requests up to 3 times
- Log failures for manual review
- Continue processing remaining models
- Track failure count per model

### 2. Data Validation
- Validate AI response format
- Check for required fields
- Verify data types and ranges
- Flag inconsistent information

### 3. Manual Review Queue
- Models with low confidence scores (<60%)
- Models with conflicting information
- Models with API failures
- New/unknown models

## Cost Optimization

### 1. Batch Processing
- Process models in batches of 10
- Add delays between API calls
- Use cheaper AI models when possible

### 2. Incremental Updates
- Only process models marked as 'basic' quality
- Skip recently enriched models
- Prioritize high-value models first

### 3. Smart Prompting
- Use efficient prompt templates
- Request structured JSON responses
- Minimize token usage in prompts

## Success Criteria

- Models are enriched with comprehensive prompt guidance
- Performance insights are added with source attribution
- Use cases are accurately identified and categorized
- Prompt optimization tips are actionable and specific
- Data quality is tracked and verifiable
- Cost remains under $20 per batch of 100 models
- Confidence scores accurately reflect data reliability

## Testing Strategy

1. **Start Small**: Test with 3-5 well-known models
2. **Validate Output**: Check schema compliance and data quality
3. **Compare Sources**: Cross-reference AI findings with official docs
4. **Manual Review**: Verify prompt guidance recommendations
5. **Cost Monitoring**: Track AI API usage and costs
6. **Incremental Rollout**: Gradually increase batch sizes

## Workflow Schedule

- **Phase 1**: Manual execution for testing (first 50 models)
- **Phase 2**: Monthly scheduled runs (all models)
- **Phase 3**: Quarterly deep enrichment updates
- **Emergency**: Manual trigger for specific models as needed