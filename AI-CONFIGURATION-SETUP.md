# AI Configuration Management System

This document describes the AI Configuration management system that has been set up in the PrompTick admin panel to manage the 19 AI use case configurations.

## Overview

The AI Configuration management system provides a comprehensive interface for managing AI use cases across the entire PrompTick application. It includes:

- **Dashboard**: Overview of all configurations organized by category (agents, services, workflows, api-endpoints)
- **Configuration Management**: Create, read, update, and delete AI configurations
- **Usage Statistics**: Monitor performance, costs, and usage patterns
- **Workflow Integration**: Track agent dependencies and workflow relationships

## Architecture

### Files Created/Modified

#### Admin Panel (`/Users/sajalgarg/Desktop/Cursor/PrompTick-admin-panel`)

1. **Types**:
   - `types/ai-configuration-schema.ts` - Complete type definitions for AI configurations

2. **Pages**:
   - `app/ai-configurations/page.tsx` - Main configurations dashboard
   - `app/ai-configurations/stats/page.tsx` - Usage statistics and monitoring

3. **Components**:
   - `components/AIConfigEditModal.tsx` - Comprehensive configuration editing interface
   - Updated `components/AdminLayout.tsx` - Added AI Configurations to navigation

4. **API Endpoints**:
   - `app/api/admin/ai-configurations/route.ts` - CRUD operations for configurations
   - `app/api/admin/ai-configurations/[id]/route.ts` - Individual configuration management
   - `app/api/admin/ai-configurations/stats/route.ts` - Usage statistics and analytics

5. **Environment**:
   - `.env.example` - Environment configuration template

6. **Testing**:
   - `scripts/test-ai-configurations.js` - Test script to verify system functionality

## Features

### 1. Configuration Dashboard (`/ai-configurations`)

- **Overview Cards**: Summary statistics by category (agents, services, workflows, api-endpoints)
- **Search & Filter**: Find configurations by name, description, or category
- **Configuration List**: Detailed view with workflow relationships and dependencies
- **Quick Actions**: View, edit, and manage configurations

### 2. Configuration Editor

The comprehensive editing interface includes these sections:

#### Basic Info
- Use Case ID, Display Name, Description
- Category and Subcategory
- Usage Frequency and Business Impact
- Active/Deprecated status

#### Workflow & Dependencies (NEW)
- **Parent Workflow**: Which workflow this agent belongs to
- **Workflow Step/Phase**: Specific step within the workflow
- **Execution Order**: Order of execution (1 = first)
- **Dependencies**: Other agents this depends on
- **Input Sources**: Where agent gets input data
- **Output Consumers**: What consumes agent output
- **Critical Path**: Whether workflow fails if agent fails
- **Parallel Execution**: Whether can run simultaneously

#### Model Configuration
- Primary model and fallback models
- Model selection strategy (cost-optimized, quality-focused, etc.)
- Cost optimization and limits

#### Generation Parameters
- Temperature, max tokens, response format
- Advanced parameters (topP, topK, penalties)
- Retry configuration

#### Performance & Infrastructure
- Timeout and rate limiting
- Priority levels and scheduling
- Caching configuration

#### Quality & Safety
- Content filtering and safety levels
- Output validation rules
- Quality monitoring checks

#### Monitoring & Analytics
- Logging configuration
- Metrics collection settings
- Alert thresholds
- Analytics retention

### 3. Usage Statistics Dashboard (`/ai-configurations/stats`)

- **Overview Metrics**: Total configurations, API calls, costs, performance
- **Performance Alerts**: High latency, costs, low success rates
- **Category Breakdown**: Performance metrics by category
- **Top Performers**: Most used and most expensive configurations
- **Recent Activity**: Recently used configurations

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# Firebase Configuration (same as main PrompTick app)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email  
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin Authentication
ADMIN_API_KEY=prompt-guru-admin-2024-secure-key
NEXT_PUBLIC_ADMIN_API_KEY=prompt-guru-admin-2024-secure-key
```

### 2. Database Setup

The system uses the `aiUseCaseConfigs` collection in Firestore. The 19 configurations should already be initialized from the main PrompTick application.

### 3. Start the Admin Panel

```bash
cd /Users/sajalgarg/Desktop/Cursor/PrompTick-admin-panel
npm install
npm run dev
```

Navigate to: http://localhost:3001/ai-configurations

### 4. Test the System

Run the test script to verify everything works:

```bash
# Set environment variables first
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'

# Run test
node scripts/test-ai-configurations.js
```

## API Endpoints

### Configuration Management

- `GET /api/admin/ai-configurations` - List all configurations
- `POST /api/admin/ai-configurations` - Create new configuration
- `PUT /api/admin/ai-configurations` - Bulk update configurations
- `DELETE /api/admin/ai-configurations?ids=id1,id2` - Delete configurations

### Individual Configuration

- `GET /api/admin/ai-configurations/[id]` - Get specific configuration
- `PUT /api/admin/ai-configurations/[id]` - Update configuration
- `DELETE /api/admin/ai-configurations/[id]` - Delete configuration
- `PATCH /api/admin/ai-configurations/[id]` - Partial update (toggle status, etc.)

### Statistics

- `GET /api/admin/ai-configurations/stats` - Get comprehensive usage statistics
- `POST /api/admin/ai-configurations/stats` - Update usage statistics

All endpoints require `x-admin-key` header for authentication.

## Workflow Integration Features

The system now includes comprehensive workflow tracking to help system admins understand:

### Agent Relationships
- **Parent Workflow**: Which overall workflow the agent belongs to
- **Dependencies**: Which other agents this one depends on
- **Execution Order**: The sequence of agent execution
- **Critical Path**: Whether the workflow fails if this agent fails

### Data Flow
- **Input Sources**: Where the agent gets its data (user input, previous agents, database)
- **Output Consumers**: What uses the agent's output (next agents, UI, database)
- **Parallel Execution**: Whether the agent can run simultaneously with others

### Visual Indicators
- Workflow information is prominently displayed in the configuration list
- Critical path agents are highlighted with red badges
- Dependencies are shown clearly for troubleshooting
- Execution order helps understand workflow sequence

## Usage Examples

### View All Configurations
Navigate to `/ai-configurations` to see all 19 configurations organized by category with workflow information.

### Edit a Configuration
Click the edit button on any configuration to open the comprehensive editing modal with all configuration sections.

### Monitor Performance
Visit `/ai-configurations/stats` to see:
- Usage patterns across all configurations
- Cost analysis by category
- Performance alerts for problematic configurations
- Recently used configurations

### Create New Configuration
Click "Add Configuration" to create a new AI use case with full workflow integration.

## Benefits for System Admins

1. **Complete Visibility**: See all AI configurations in one place with workflow context
2. **Dependency Tracking**: Understand how agents relate to each other in workflows
3. **Performance Monitoring**: Track costs, latency, and success rates
4. **Easy Management**: Edit configurations without touching code
5. **Troubleshooting**: Quickly identify issues with critical path agents
6. **Cost Control**: Monitor and optimize AI usage costs across the system
7. **Workflow Understanding**: Clear view of how agents fit into larger workflows

## Security

- All API endpoints require admin authentication
- Environment variables secure Firebase credentials
- Separate admin interface prevents accidental changes to production configurations
- Audit trail tracks all configuration changes

The system is now ready to manage all 19 AI configurations with comprehensive workflow integration and monitoring capabilities.