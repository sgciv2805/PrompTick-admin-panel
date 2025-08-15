# N8N Workflow 1: OpenRouter Basic Model Sync - Detailed Instructions

## Overview
Create an N8N workflow that fetches all models from OpenRouter API and syncs them to Firestore database with basic information formatted according to our database schema.

## Workflow Requirements

### 1. Trigger
- **Node Type**: Schedule Trigger
- **Schedule**: Weekly (every Sunday at 2 AM)
- **Manual Trigger**: Also support manual execution

### 2. API Call
- **Node Type**: HTTP Request
- **URL**: `https://openrouter.ai/api/v1/models`
- **Method**: GET
- **Authentication**: HTTP Header Auth
  - Header Name: `Authorization`
  - Header Value: `Bearer {OPENROUTER_API_KEY}`
- **Expected Response**: JSON with `data` array containing model objects

### 3. Data Processing
- **Node Type**: Split Out
- **Field to Split**: `data`
- **Purpose**: Convert array of models into individual items for processing

### 4. Data Transformation
- **Node Type**: Function
- **Purpose**: Transform each OpenRouter model into our database schema format
- **Input**: Single model object from OpenRouter
- **Output**: Two objects - `provider` and `model` data

### 5. Database Updates
- **Node Type**: Google Firebase Cloud Firestore (2 nodes)
- **Operation**: Create/Update (with merge option)
- **Collections**: `providers` and `models`
- **Project ID**: `prompt-guru-2cbff`

## OpenRouter API Response Format
```json
{
  "data": [
    {
      "id": "openai/gpt-4o",
      "name": "OpenAI: GPT-4o",
      "created": 1715367600,
      "description": "GPT-4o is OpenAI's new flagship multimodal model...",
      "context_length": 128000,
      "architecture": {
        "modality": "text+image->text",
        "tokenizer": "cl100k_base",
        "instruct_type": null
      },
      "pricing": {
        "prompt": "0.000005",
        "completion": "0.000015",
        "image": "0.00425",
        "request": "0"
      },
      "top_provider": {
        "context_length": 128000,
        "max_completion_tokens": 4096,
        "is_moderated": true
      },
      "supported_parameters": [
        "temperature", "top_p", "max_tokens", "tools"
      ]
    }
  ]
}
```

## Required Output Schema

**IMPORTANT**: Only populate fields with actual data from OpenRouter API. Use "unknown", empty arrays [], or null for fields not available from OpenRouter. Workflow 2 will enrich these with researched data.

### Provider Document (Collection: `providers`)
```json
{
  "id": "openai",
  "name": "OpenAI",
  "displayName": "OpenAI",
  "website": "unknown",
  "apiBaseUrl": "unknown",
  "authTypes": [],
  "supportLevels": [],
  "reliability": "unknown",
  "defaultSettings": {},
  "isActive": true,
  "lastStatusCheck": "2024-07-30T18:00:00.000Z",
  "tags": ["llm"],
  "description": "AI model provider - details to be enriched",
  "createdAt": "2024-07-30T18:00:00.000Z",
  "updatedAt": "2024-07-30T18:00:00.000Z"
}
```

### Model Document (Collection: `models`)
```json
{
  "id": "openai-gpt-4o",
  "name": "OpenAI: GPT-4o",
  "providerId": "openai",
  "fullModelPath": "openai/gpt-4o",
  
  "specifications": {
    "version": "unknown",
    "releaseDate": "unknown",
    "trainingCutoff": "unknown",
    "architecture": "cl100k_base"
  },
  
  "capabilities": {
    "supportsImages": true,
    "supportsCodeExecution": false,
    "supportsFunctionCalling": true,
    "supportsStreaming": true,
    "supportsVision": true,
    "supportsAudio": false,
    "supportedFormats": ["text", "json"],
    "languages": [],
    "maxTokens": 4096,
    "contextWindow": 128000,
    "specialFeatures": []
  },
  
  "performance": {
    "qualityTier": 4,
    "speedTier": 4,
    "costTier": 4,
    "reliabilityScore": "unknown",
    "averageLatencyMs": "unknown",
    "throughputRequestsPerMin": "unknown"
  },
  
  "pricing": {
    "inputTokenCost": 0.000005,
    "outputTokenCost": 0.000015,
    "imageInputCost": 0.00425,
    "currency": "USD",
    "source": "openrouter-api",
    "lastUpdated": "2024-07-30T18:00:00.000Z",
    "isVerified": true
  },
  
  "promptGuidance": {
    "structure": {
      "preferredFormat": "conversation",
      "systemPromptStyle": "directive",
      "maxSystemPromptLength": 4000,
      "maxUserPromptLength": 102400,
      "supportsRoleBasedPrompts": true
    },
    "communicationStyle": {
      "tone": [],
      "clarity": "unknown",
      "verbosity": "unknown",
      "instructionStyle": "unknown"
    },
    "optimizationTechniques": {
      "effectiveTechniques": [],
      "avoidTechniques": [],
      "preferredFormats": {
        "lists": "unknown",
        "code": "unknown",
        "data": "unknown",
        "reasoning": "unknown"
      }
    },
    "contextHandling": {
      "maxEffectiveContextLength": 115200,
      "contextPlacement": "unknown",
      "exampleCount": {"min": "unknown", "max": "unknown", "optimal": "unknown"},
      "examplePlacement": "unknown",
      "contextCompressionTolerance": "unknown"
    },
    "taskSpecificGuidance": {},
    "variableHandling": {
      "preferredVariableSyntax": {"before": "unknown", "after": "unknown"},
      "variablePlacement": "unknown",
      "maxVariables": "unknown",
      "complexVariableSupport": "unknown",
      "variableNaming": "unknown"
    },
    "reliabilityNotes": {
      "consistentAt": [],
      "inconsistentAt": [],
      "commonFailureModes": [],
      "mitigationStrategies": [],
      "temperatureRecommendations": {
        "creative": "unknown",
        "analytical": "unknown",
        "factual": "unknown",
        "conversational": "unknown"
      }
    }
  },
  
  "workflowIntegration": {
    "defaultStrategy": "unknown",
    "webhookEnhancements": {
      "includeModelGuidance": false,
      "guidanceFields": [],
      "preferredWorkflowType": "unknown"
    },
    "testingConsiderations": {
      "recommendedTestTypes": [],
      "evaluationCriteria": [],
      "knownTestingChallenges": [],
      "optimalTestPromptLength": "unknown"
    }
  },
  
  "categories": ["flagship", "multimodal"],
  "strengths": ["coding", "multimodal-tasks"],
  "idealUseCases": ["coding", "multimodal-tasks"],
  "industries": [],
  
  "tags": ["openai", "openrouter"],
  "description": "GPT-4o is OpenAI's new flagship multimodal model...",
  
  "status": "active",
  "availability": {
    "regions": ["global"],
    "accessLevel": "public",
    "requiresApproval": false
  },
  
  "dataSource": {
    "scrapedFrom": ["https://openrouter.ai/api/v1/models"],
    "lastSuccessfulUpdate": "2024-07-30T18:00:00.000Z",
    "updateFrequency": "weekly",
    "failureCount": 0,
    "dataQuality": "basic",
    "verificationMethod": "api"
  },
  
  "createdAt": "2024-07-30T18:00:00.000Z",
  "updatedAt": "2024-07-30T18:00:00.000Z"
}
```

## Transformation Logic Required

### 1. Provider ID Extraction
```javascript
function extractProvider(modelId) {
  const parts = modelId.split('/');
  return parts.length > 1 ? parts[0] : 'unknown';
}
```

### 2. Performance Tier Calculation
```javascript
function estimatePerformanceTiers(pricing) {
  const avgCost = (parseFloat(pricing.prompt) + parseFloat(pricing.completion)) / 2;
  
  let qualityTier, speedTier, costTier;
  
  if (avgCost > 0.00001) {
    qualityTier = 5; speedTier = 3; costTier = 5;
  } else if (avgCost > 0.000005) {
    qualityTier = 4; speedTier = 4; costTier = 4;
  } else if (avgCost > 0.000001) {
    qualityTier = 3; speedTier = 4; costTier = 3;  
  } else if (avgCost > 0.0000005) {
    qualityTier = 2; speedTier = 5; costTier = 2;
  } else {
    qualityTier = 1; speedTier = 5; costTier = 1;
  }
  
  return { qualityTier, speedTier, costTier };
}
```

### 3. Use Case Mapping
```javascript
function mapUseCases(description, name) {
  const desc = (description + ' ' + name).toLowerCase();
  const useCases = [];
  
  if (desc.includes('code') || desc.includes('programming')) useCases.push('coding');
  if (desc.includes('chat') || desc.includes('conversation')) useCases.push('conversation');
  if (desc.includes('analysis') || desc.includes('reasoning')) useCases.push('analysis');
  if (desc.includes('creative') || desc.includes('writing')) useCases.push('content-creation');
  if (desc.includes('research') || desc.includes('knowledge')) useCases.push('research');
  if (desc.includes('vision') || desc.includes('image')) useCases.push('multimodal-tasks');
  
  return useCases.length > 0 ? useCases : ['general'];
}
```

### 4. Category Mapping
```javascript
function mapCategories(name, description) {
  const text = (name + ' ' + description).toLowerCase();
  const categories = [];
  
  if (text.includes('gpt-4') || text.includes('claude-3') || text.includes('flagship')) categories.push('flagship');
  if (text.includes('mini') || text.includes('small') || text.includes('efficient')) categories.push('efficient');
  if (text.includes('fast') || text.includes('turbo')) categories.push('fast');
  if (text.includes('vision') || text.includes('multimodal')) categories.push('multimodal');
  if (text.includes('reasoning') || text.includes('analysis')) categories.push('reasoning');
  
  return categories.length > 0 ? categories : ['general'];
}
```

## Data Flow
1. **Schedule Trigger** → Weekly execution
2. **HTTP Request** → Fetch all models from OpenRouter
3. **Split Out** → Convert model array to individual items
4. **Function Node** → Transform each model using the logic above (ONLY OpenRouter data + calculated fields)
5. **Firestore Node 1** → Create/update provider document
6. **Firestore Node 2** → Create/update model document

## What Gets Populated in Workflow 1

### ✅ **From OpenRouter API (Real Data)**:
- Model name, description, pricing
- Context length, max tokens
- Architecture info (tokenizer, modality)
- Supported parameters
- Provider ID (extracted from model path)

### ✅ **Calculated/Derived**:
- Performance tiers (from pricing)
- Use cases (from description keywords)
- Categories (from name/description keywords)
- Provider name (from provider ID)

### ❌ **NOT Populated (Wait for Workflow 2)**:
- Detailed prompt guidance
- Reliability assessments
- Language support details
- Performance benchmarks
- Industry applications
- Workflow integration details

## Key Features
- **Upsert Logic**: Use merge option to update existing documents without overwriting enriched data
- **Error Handling**: Handle API failures gracefully
- **Data Validation**: Ensure required fields are populated
- **Timestamp Tracking**: Add created/updated timestamps
- **Provider Deduplication**: Only create provider once per unique provider

## Success Criteria
- All models from OpenRouter API are imported
- Provider documents are created for each unique provider
- Model documents contain all required schema fields
- **NO HARDCODED DEFAULTS**: Only real OpenRouter data or "unknown" values
- **NO ASSUMPTIONS**: Empty arrays for unknown data, not generic defaults
- Existing enriched data is preserved (merge, not overwrite)
- Workflow runs successfully on schedule
- Manual execution works for immediate updates

## Testing
- Test with a small subset of models first
- Verify schema compliance in Firestore
- Check that pricing data is correctly parsed
- Ensure performance tiers are calculated properly
- Confirm use cases are mapped correctly