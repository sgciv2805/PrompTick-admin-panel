# AI Model Enrichment Workflow Instructions

## Overview

This document provides detailed instructions for the AI Model Enrichment workflow, which uses Google's Gemini API to research and enrich AI model data with comprehensive information for the Prompt Guru platform.

## Required Fields for Enrichment

The AI enrichment process populates the following fields in the ModelDocument schema:

### Basic Information
- `id` - Model identifier (e.g., "gpt-4o", "claude-3-5-sonnet")
- `name` - Display name
- `providerId` - Provider identifier (e.g., "openai", "anthropic")

### Performance Metrics
- `performance.qualityTier` - Quality rating (1-5 scale)
- `performance.speedTier` - Speed rating (1-5 scale)
- `performance.costTier` - Cost rating (1-5 scale)

### Capabilities
- `capabilities.supportsImages` - Image support capability
- `capabilities.supportsFunctionCalling` - Function calling support
- `capabilities.contextWindow` - Max input context length
- `capabilities.maxTokens` - Max output tokens

### Pricing
- `pricing.inputTokenCost` - Cost per 1k input tokens
- `pricing.outputTokenCost` - Cost per 1k output tokens

### Classification
- `categories` - Model categories (flagship, efficient, fast, specialized, etc.)
- `strengths` - What the model excels at
- `idealUseCases` - Best use cases
- `status` - Model status (active, deprecated, etc.)

## AI Research Process

### 1. Prompt Structure
The AI is prompted with a detailed JSON structure that includes:
- Use case analysis
- Prompt optimization guidance
- Performance insights
- Technical details
- Source tracking
- Confidence scoring

### 2. Research Guidelines
The AI follows these guidelines:
1. Only include factual information that can be verified
2. Mark uncertain information with appropriate confidence levels
3. Include sources for all claims
4. Focus on practical, actionable insights
5. Return valid JSON only

### 3. Data Validation
The system validates:
- Required sections are present
- Data types match the schema
- Values fall within expected ranges
- Sources are properly formatted

## Workflow Configuration

### AI Provider Settings
- **Provider**: Google Gemini
- **Models**: gemini-1.5-flash (default), gemini-1.5-pro (premium)
- **API Key**: Required for all operations

### Processing Settings
- **Batch Size**: 1-50 models per batch
- **Cost Control**: Configurable maximum cost per batch
- **Data Quality**: Basic, Enhanced, or Premium research depth
- **Validation**: Optional additional validation research

### Test Mode
- Research models without updating the database
- Preview AI responses and parsed data
- Validate results before applying to production

## Data Quality Standards

### Confidence Levels
- **High**: Well-sourced, consistent information
- **Medium**: Some uncertainty or limited sources
- **Low**: Speculative or unverified information

### Verification Methods
- **Manual**: AI research with source verification
- **API**: Direct API data retrieval
- **Scraping**: Web scraping with validation

### Quality Tiers
- **Verified**: Confirmed by AI research or direct sources
- **Estimated**: Reasonable estimates based on available data
- **Outdated**: Previously verified but may be stale
- **Unknown**: No reliable data available

## Cost Management

### Pricing Estimates
- **Basic Research**: ~$0.02-0.03 per model
- **Enhanced Research**: ~$0.03-0.05 per model
- **Premium Research**: ~$0.05-0.10 per model

### Cost Controls
- Per-batch spending limits
- Automatic workflow pausing when limits reached
- Detailed cost tracking and reporting

## Error Handling

### Common Issues
- API key validation failures
- Rate limiting from AI providers
- Invalid JSON responses from AI
- Database update conflicts

### Recovery Procedures
- Automatic retry with exponential backoff
- Fallback to basic data on parsing failures
- Manual intervention for persistent errors
- Detailed error logging for debugging

## Monitoring and Logging

### Execution Tracking
- Real-time progress updates
- Detailed activity logs
- Performance metrics collection
- Cost tracking and reporting

### Data Quality Monitoring
- Confidence score tracking
- Source verification status
- Update frequency monitoring
- Stale data detection

## Best Practices

### For Optimal Results
1. Use test mode to validate new configurations
2. Start with smaller batch sizes for new providers
3. Monitor confidence scores and adjust research depth
4. Regularly verify pricing data as it changes frequently
5. Keep API keys secure and rotate regularly

### For Cost Management
1. Use Flash models for batch processing
2. Set appropriate cost limits per batch
3. Monitor spending through the admin dashboard
4. Use test mode for experimentation
5. Schedule regular enrichments rather than continuous processing

## Integration Points

### Database Schema
- Updates ModelDocument with enriched data
- Maintains data quality tracking
- Preserves existing custom data
- Adds enrichment metadata

### Admin Interface
- Configurable workflow parameters
- Real-time execution monitoring
- Test mode for validation
- Detailed result inspection

### API Endpoints
- `/api/admin/workflows/enrichment/start` - Start batch enrichment
- `/api/admin/workflows/test-single` - Test single model research
- `/api/admin/workflows/update-single` - Update single model
- `/api/admin/workflows/apply-test-results` - Apply test results
- `/api/admin/workflows/execution/[id]` - Get execution status
- `/api/admin/workflows/models-for-enrichment` - Get available models
- `/api/admin/workflows/stats` - Get workflow statistics