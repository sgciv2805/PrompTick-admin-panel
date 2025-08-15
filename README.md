# Prompt Guru Admin Panel

A separate administrative dashboard for managing AI models and system data for the Prompt Guru SaaS platform.

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure:
```bash
cp .env.local.example .env.local
```

Required environment variables:
```env
# Firebase Admin Configuration (same as main app)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"

# Admin Authentication
ADMIN_API_KEY=prompt-guru-admin-2024-secure-key
```

### 3. Start Development Server
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

## 🚀 Features

### Model Management
- **Database Seeding**: Populate Firestore with comprehensive AI model data
- **Model Stats**: View total models, pricing data, and capabilities
- **Connection Testing**: Verify API connectivity

### Included Models
- **OpenAI GPT-4o** and GPT-4o Mini
- **Anthropic Claude 3.5 Sonnet**
- **Google Gemini** (Pro and Flash variants)
- **Complete Metadata**: Pricing, capabilities, performance metrics, prompt guidance

## 🔐 Security

- **API Key Authentication**: All admin operations require the `x-admin-key` header
- **Separate Deployment**: Isolated from main SaaS application
- **Environment Variables**: Sensitive data stored securely

## 📁 Project Structure

```
admin-panel/
├── app/
│   ├── page.tsx              # Dashboard homepage
│   ├── models/
│   │   └── page.tsx          # Model management interface
│   └── api/admin/
│       └── seed-models/
│           └── route.ts      # Model seeding API
├── components/
│   └── AdminLayout.tsx       # Main admin layout
├── lib/
│   ├── firebase-admin.ts     # Firebase admin configuration
│   ├── model-data-seeder.ts  # Model seeding utilities
│   └── utils.ts              # Utility functions
└── types/
    └── model-schema.ts       # Model type definitions
```

## 🔗 API Endpoints

### POST /api/admin/seed-models
Seed the model database with comprehensive AI model data.

**Headers:**
```
x-admin-key: prompt-guru-admin-2024-secure-key
Content-Type: application/json
```

**Actions:**
- `seed-all` - Seed all providers and models
- `seed-specific` - Seed specific models by ID array  
- `update-model` - Update existing model data
- `test` - Test API connection

**Example:**
```bash
curl -X POST http://localhost:3001/api/admin/seed-models \
  -H "x-admin-key: prompt-guru-admin-2024-secure-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "seed-all"}'
```

## 🚦 Development

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## 📋 Coming Soon

- **Model Browser**: Browse and edit individual models
- **Batch Operations**: Update multiple models at once
- **User Management**: Manage user accounts and permissions
- **System Monitoring**: Performance metrics and logs
- **Analytics Dashboard**: Usage statistics and insights

## 🔄 Integration

This admin panel is designed to work alongside your main Prompt Guru SaaS application:

- **Shared Database**: Both applications use the same Firestore database
- **Shared Types**: Model schemas and types are synchronized
- **Independent Deployment**: Can be deployed separately for security
- **API Integration**: Uses the same model seeding infrastructure

## 🛡️ Production Deployment

1. Deploy to a separate subdomain (e.g., `admin.prompt-guru.com`)
2. Configure environment variables in your hosting platform
3. Set up proper access controls and VPN if needed
4. Monitor admin operations through logging

## 📝 Notes

- This admin panel is completely separate from your main SaaS product
- No changes were made to your existing codebase
- All model seeding functionality is self-contained
- Firebase configuration mirrors your main application