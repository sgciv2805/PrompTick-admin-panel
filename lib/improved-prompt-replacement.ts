export const IMPROVED_RESEARCH_PROMPT = `You are a model capability research expert. Research the AI model "{MODEL_NAME}" by {PROVIDER_ID} to discover its ACTUAL capabilities and optimal use cases.

CRITICAL: DO NOT use predefined categories. Instead, discover what this model ACTUALLY excels at based on:
- Official documentation from {PROVIDER_ID}
- Real user experiences and benchmarks
- Technical specifications and architecture
- Community feedback and case studies
- Performance comparisons with other models

I need {DETAIL_LEVEL} information formatted as JSON with the following structure:

{
  "useCaseAnalysis": {
    "idealUseCases": [
      // DISCOVER ACTUAL use cases - NOT from a predefined list
      // Research what this model is ACTUALLY good at
      // Examples: "legal document analysis", "creative storytelling", "technical documentation", 
      // "image-to-text conversion", "code debugging", "scientific paper summarization"
      // DO NOT include video-generation unless model ACTUALLY supports video
    ],
    "strengths": [
      // SPECIFIC strengths discovered from research
      // NOT generic terms like "reasoning" or "creativity"
      // Examples: "exceptional at following complex multi-step instructions",
      // "maintains consistency across long documents", "handles technical jargon accurately"
    ],
    "industries": [
      // SPECIFIC industries where this model shows proven success
      // Based on actual case studies and user reports
    ], 
    "limitations": [
      // REAL limitations discovered from user feedback and testing
      // Be specific about what this model struggles with
    ],
    "uniqueCapabilities": [
      // What makes this model DIFFERENT from others?
      // Specific technical capabilities that set it apart
    ],
    "categories": [
      // Only include categories that are ACTUALLY accurate
      // Options: "flagship", "efficient", "fast", "specialized", "multimodal", "code", "reasoning", "analysis"
      // Base on REAL performance data, not assumptions
    ]
  },
  
  "realWorldPerformance": {
    "benchmarkData": [
      // ACTUAL benchmark results with sources
      // Example: "87.4% on MMLU benchmark (source: official paper)"
    ],
    "userReports": [
      // What do REAL USERS say about performance?
      // Specific examples of success/failure cases
    ],
    "comparativeAnalysis": [
      // How does it compare to similar models?
      // Specific performance differences
    ]
  },
  
  "promptOptimization": {
    "bestPractices": [
      // SPECIFIC techniques that work well with THIS model
      // Based on actual testing and community knowledge
    ],
    "effectiveTechniques": [
      // Proven prompt engineering techniques for THIS model
    ],
    "avoidTechniques": [
      // What NOT to do with this model (based on real experience)
    ],
    "temperatureRecommendations": {
      // RESEARCH actual optimal temperatures for different tasks
      "creative": 0.7,    // Based on actual testing
      "analytical": 0.3,  // Based on actual testing
      "factual": 0.1,     // Based on actual testing
      "conversational": 0.5 // Based on actual testing
    },
    "modelSpecificTips": [
      // Unique tips that work specifically with THIS model
      // Not generic advice that applies to all models
    ]
  },
  
  "templateContext": {
    "preferredPromptFormats": [
      // RESEARCH which formats this model responds to best
      // Examples: "XML tags work better than markdown for Claude",
      // "JSON structure preferred for GPT models"
    ],
    "communicationStyles": [
      // What communication style works best with THIS model?
      // Based on testing and community feedback
    ],
    "variableSyntaxPreferences": [
      // Which variable syntax does this model handle most reliably?
      // Test {{variable}}, \${variable}, [variable], etc.
    ],
    "structuralPatterns": [
      // What prompt structures are most effective for this model?
    ],
    "optimalPromptLengths": {
      "simple": "specific length range based on model testing",
      "moderate": "specific length range based on model testing", 
      "complex": "specific length range based on model testing"
    },
    "contextHandlingStyle": [
      // How should context be structured for optimal performance?
    ],
    "effectiveInstructionTypes": [
      // What instruction styles does the model follow most accurately?
    ],
    "templateCompatibilityNotes": [
      // Any model-specific considerations for prompt templates
    ]
  },
  
  "performanceInsights": {
    "benchmarkResults": [
      // ACTUAL benchmark scores with sources and URLs
    ],
    "userFeedback": [
      // Real user experiences from forums, reviews, case studies
    ],
    "reliabilityAssessment": {
      "consistentAt": ["tasks it handles consistently based on research"],
      "inconsistentAt": ["tasks with variable performance based on research"],
      "commonFailures": ["known failure modes from user reports"]
    }
  },
  
  "performanceAnalysis": {
    // CRITICAL: Base these on ACTUAL research, not guesswork
    "qualityTier": 4, // 1-5 scale based on REAL benchmarks and user feedback
    "speedTier": 3,   // 1-5 scale based on MEASURED response times
    "costTier": 3,    // 1-5 scale based on ACTUAL current pricing
    "reliabilityScore": 92, // 0-100 based on uptime and consistency reports
    "averageLatencyMs": 1500, // ACTUAL measured latency from tests/reports
    "throughputRequestsPerMin": 500, // REAL capacity from provider docs
    
    // NEW: Detailed scoring explanation
    "scoringRationale": {
      "qualityReason": "Based on MMLU score of X% and user reports of Y",
      "speedReason": "Average Xs response time reported in community benchmarks",
      "costReason": "$X/1K tokens places it in Z pricing tier",
      "reliabilityReason": "X% uptime over last 6 months according to status page"
    }
  },
  
  "technicalDetails": {
    "actualVersion": "research the ACTUAL current version",
    "releaseDate": "YYYY-MM-DD based on research",
    "trainingCutoff": "research actual knowledge cutoff",
    "specialCapabilities": [
      // SPECIFIC capabilities that differentiate this model
      // Examples: "function calling", "vision processing", "code execution"
    ],
    "languageSupport": [
      // RESEARCH which languages this model actually supports well
    ],
    "modalitySupport": {
      // CRITICAL: Research actual modality support
      "text": true,
      "images": false, // Based on ACTUAL capability research
      "video": false,  // Based on ACTUAL capability research  
      "audio": false,  // Based on ACTUAL capability research
      "code": true     // Based on ACTUAL capability research
    },
    "contextHandling": {
      "effectiveLength": "ACTUAL usable context based on testing",
      "recommendations": "specific context usage tips for this model"
    }
  },
  
  "sources": [
    // ALL sources used - be comprehensive and include URLs
    "https://official-docs-url",
    "https://benchmark-results-url", 
    "https://community-discussion-url",
    "https://technical-paper-url"
  ],
  "confidence": "high", // Only if you found comprehensive reliable information
  "lastResearched": "{TIMESTAMP}"
}

Current model context:
- Context window: {CONTEXT_WINDOW}
- Max tokens: {MAX_TOKENS}  
- Current categories: {CURRENT_CATEGORIES}
- Current description: {CURRENT_DESCRIPTION}

RESEARCH METHODOLOGY - FOLLOW THESE STEPS:

1. **CAPABILITY DISCOVERY** (Most Important):
   - Research official {PROVIDER_ID} documentation for {MODEL_NAME}
   - Look for specific examples of what this model excels at
   - Find case studies and real-world applications
   - Identify what makes this model unique vs competitors
   - Discover modality support (text, images, video, audio, code)

2. **PERFORMANCE RESEARCH**:
   - Find ACTUAL benchmark scores (MMLU, HumanEval, etc.)
   - Research real user experiences and reviews  
   - Look for speed/latency measurements
   - Find current pricing information
   - Check uptime and reliability reports

3. **USE CASE VALIDATION**:
   - Don't assume use cases - DISCOVER them
   - Look for specific examples of successful applications
   - Find industries/domains where this model excels
   - Identify tasks where this model outperforms alternatives

4. **PROMPT ENGINEERING RESEARCH**:
   - Find model-specific prompt engineering guides
   - Research community best practices for this model
   - Look for format preferences (XML vs JSON vs markdown)
   - Find optimal temperature settings for different tasks

5. **DIFFERENTIATION ANALYSIS**:
   - What makes this model different from GPT-4, Claude, Gemini?
   - What specific advantages does it offer?
   - What are its unique capabilities or architectural features?
   - In what scenarios would you choose this over alternatives?

PERFORMANCE ANALYSIS GUIDELINES:
- qualityTier: Research actual quality from benchmarks and user reviews
  * 5=GPT-4/Claude-3.5-Sonnet level (top reasoning, accuracy, complex tasks)
  * 4=GPT-3.5-turbo/Claude-3-Haiku level (high quality for most tasks)
  * 3=Decent quality (handles intermediate tasks well)
  * 2=Basic quality (suitable for simple tasks only)
  * 1=Poor quality (very limited use cases)
- speedTier: Research actual response times from reviews and documentation
  * 5=<500ms typical response (very fast, real-time feel)
  * 4=500ms-2s typical response (fast, good user experience)
  * 3=2s-5s typical response (moderate, acceptable for most use cases)
  * 2=5s-10s typical response (slow, may frustrate users)
  * 1=>10s typical response (very slow, only for non-interactive use)
- costTier: Research current market pricing - CRITICAL for cost optimization
  * 5=Premium pricing ($0.03+ per 1K tokens, like GPT-4)
  * 4=High pricing ($0.01-0.03 per 1K tokens)
  * 3=Moderate pricing ($0.002-0.01 per 1K tokens)
  * 2=Low pricing ($0.0005-0.002 per 1K tokens)
  * 1=Very low pricing (<$0.0005 per 1K tokens, often open source)

CRITICAL FOR VIDEO EXAMPLE:
If the user asks about video generation and this model doesn't support video:
- Clearly mark "video": false in modalitySupport
- Do NOT include "video-generation" in idealUseCases
- In limitations, mention "Does not support video generation or processing"
- Recommend alternative models that DO support video if relevant

QUALITY STANDARDS:
- Mark confidence as "low" ONLY if critical information is missing
- Provide specific, actionable insights, not generic statements
- Include measurable data points whenever possible
- Focus on what makes this model UNIQUE and VALUABLE
- Base all ratings on research, not assumptions

PRICING: DO NOT OVERRIDE OpenRouter pricing data - it's deterministic and accurate
- Only research pricing if model has no existing pricing data
- If model has pricing data, skip the pricing section entirely
- For models without pricing: research inputTokenCost/outputTokenCost per 1k tokens in USD
- Always verify from official provider pricing pages, not third-party sources

Return ONLY valid JSON - no additional text or explanations.`;