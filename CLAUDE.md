# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Prompt Guru Admin Panel** - a separate Next.js 15 administrative dashboard for managing AI models and system data for the Prompt Guru SaaS platform. It runs independently on port 3001 and provides comprehensive model management capabilities.

## Core Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Firebase/Firestore (shared with main SaaS app)
- **Styling**: Tailwind CSS
- **Components**: Custom components with class-variance-authority
- **Forms**: React Hook Form with Zod validation
- **Authentication**: API key-based admin authentication

### Project Structure
```
app/
├── page.tsx                    # Dashboard homepage
├── models/page.tsx             # Model management interface  
├── api/admin/
│   ├── seed-models/route.ts    # Model seeding API endpoint
│   └── models/[id]/route.ts    # Individual model operations
components/
├── AdminLayout.tsx             # Main admin layout wrapper
lib/
├── firebase-admin.ts           # Firebase admin SDK configuration
├── model-data-seeder.ts        # Core model seeding utilities
└── utils.ts                    # Utility functions
types/
└── model-schema.ts             # Comprehensive model type definitions
```

### Key Design Patterns
- **API Key Authentication**: All admin operations require `x-admin-key` header
- **Firebase Admin SDK**: Server-side Firestore operations with admin credentials
- **Comprehensive Type System**: Detailed TypeScript interfaces for model data, capabilities, performance metrics, and prompt guidance
- **Seeding Architecture**: Centralized model data seeding with multiple operation modes

## Development Commands

### Core Development
```bash
npm run dev          # Start development server on port 3001
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Testing and Quality Assurance
Always run these commands before committing changes:
```bash
npm run typecheck    # Must pass - strict TypeScript checking enabled
npm run lint         # Must pass - Next.js ESLint configuration
```

## Environment Configuration

Required environment variables:
```env
# Firebase Admin (shared with main app)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email  
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin Authentication
ADMIN_API_KEY=prompt-guru-admin-2024-secure-key
```

## Key API Endpoints

### POST /api/admin/seed-models
Primary model management endpoint with actions:
- `seed-all` - Seed all providers and models (mock data)
- `seed-specific` - Seed specific models by ID array
- `update-model` - Update existing model data  
- `test` - Test API connection

### POST /api/admin/sync-openrouter
OpenRouter API sync endpoint with actions:
- `sync-all` - Fetch and sync all models from OpenRouter API
- `test` - Test OpenRouter API connection

### AI Workflows Endpoints
- `POST /api/admin/workflows/enrichment/start` - Start AI model enrichment workflow
- `GET /api/admin/workflows/execution/[id]` - Get workflow execution status
- `GET /api/admin/workflows/stats` - Get workflow statistics
- `GET /api/admin/workflows/models-for-enrichment` - Get models available for enrichment

Authentication via `x-admin-key` header required for all operations.

## Model Data Architecture

### Core Model Schema
The `types/model-schema.ts` file defines comprehensive interfaces:

- **ModelDocument**: Complete model specification with capabilities, performance, pricing
- **ModelCapabilities**: Feature support (images, streaming, function calling, etc.)
- **ModelPerformance**: Quality/speed/cost tiers, benchmarks, latency metrics
- **ModelPricing**: Token costs, pricing history, verification status
- **ModelPromptGuidance**: Detailed prompt optimization guidance per model
- **ProviderDocument**: Provider-level configuration and metadata

### Firebase Integration
- Uses Firebase Admin SDK for server-side operations
- Shared Firestore database with main SaaS application
- Singleton pattern for Firebase app initialization
- Path aliasing configured: `@/*` maps to project root

## Important Development Notes

### Next.js Configuration
- `experimental.serverComponentsExternalPackages: ['firebase-admin']` configured for Firebase Admin SDK
- TypeScript path mapping configured for `@/*` imports
- Strict TypeScript compilation with `noEmit: true`

### Security Considerations
- All admin operations require API key authentication
- Environment variables used for sensitive configuration
- Separate deployment recommended for production security
- No client-side Firebase configuration exposed

### OpenRouter API Integration
- **Live Model Sync**: Fetches current models and pricing from OpenRouter API
- **Transformation Logic**: Converts OpenRouter data to comprehensive model schema
- **Provider Extraction**: Automatically creates provider documents from model paths
- **Performance Estimation**: Calculates quality/speed/cost tiers from pricing data
- **Use Case Mapping**: Infers model capabilities from names and descriptions
- **Merge Strategy**: Uses Firestore merge to preserve existing enriched data

#### OpenRouter Sync Files:
- `lib/openrouter-sync.ts` - Core sync utility class
- `app/api/admin/sync-openrouter/route.ts` - API endpoint
- Models page UI includes manual sync controls with optional API key input

## AI Workflows System

### Architecture Overview
- **Workflows Page**: `/workflows` - Central hub for AI-powered automation
- **AI Enrichment Service**: `lib/ai-enrichment-service.ts` - Core workflow engine
- **Gemini Integration**: Uses Google Gemini API for model research and enrichment
- **Real-time Updates**: Live progress tracking with WebSocket-like polling
- **Cost Control**: Configurable batch processing and cost limits

### AI Model Enrichment Workflow
- **Research Pipeline**: Uses Gemini API to research comprehensive model information
- **Data Enhancement**: Enriches models with prompt guidance, use cases, and performance insights
- **Quality Control**: Confidence scoring and validation mechanisms
- **Progress Tracking**: Real-time logs and status updates
- **Cost Management**: Estimates and tracks AI API costs

#### Key Files:
- `app/workflows/page.tsx` - Main workflows interface
- `lib/ai-enrichment-service.ts` - AI enrichment logic
- `app/api/admin/workflows/` - Workflow API endpoints
- Firestore collections: `workflow_executions` for tracking

### Integration Points
- Shares Firestore database schema with main Prompt Guru SaaS app
- Model seeding infrastructure designed to be self-contained
- Type definitions synchronized between applications
- OpenRouter sync follows same patterns as mock data seeding
- AI workflows extend the admin panel with automation capabilities