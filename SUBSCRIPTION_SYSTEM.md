# Prompt Guru Subscription System

A comprehensive subscription and feature gating system that allows platform administrators to configure subscription plans, enforce usage limits, and control feature access through a flexible, admin-configurable interface.

## 🚀 Features

### Admin-Configurable Plans
- **4 Default Tiers**: Free, Pro, Team, Enterprise
- **Flexible Pricing**: Monthly, yearly, one-time, and usage-based billing
- **25+ Comprehensive Features** across 8 categories
- **Trial System**: Configurable trial periods with restrictions
- **Usage Limits**: Granular control over feature usage

### Feature Categories
- **Usage Limits**: Projects, prompts, executions, tokens, members, API keys
- **Testing Features**: Advanced evaluators, A/B testing, webhooks, custom criteria
- **AI Features**: Model recommendations, quality assessment, optimization suggestions
- **Analytics**: Usage dashboards, performance metrics, export capabilities
- **Organization**: Member management, role controls, team collaboration
- **Security**: SSO, audit logs, compliance features, advanced permissions
- **Integrations**: N8N webhooks, external APIs, custom integrations
- **Support**: Priority support tiers, response time guarantees

### Built-in Features Ready for Subscription Gating
- Prompt playground with model recommendations
- Advanced testing framework with custom evaluators
- Team collaboration and project sharing
- Usage analytics and performance tracking
- N8N webhook integration
- API access and key management
- Custom variable syntax configuration

## 📁 File Structure

```
src/
├── types/
│   └── subscription-schema.ts          # Comprehensive type definitions
├── lib/
│   ├── subscription-service.ts         # Core subscription management
│   ├── feature-gate-service.ts         # Feature access control
│   ├── usage-tracking-service.ts       # Usage monitoring & limits
│   ├── subscription-api.ts             # Client-side API wrapper
│   └── subscription-seeder.ts          # Database seeding script
├── hooks/
│   └── use-subscription.tsx            # React hooks for subscription state
├── components/subscription/
│   ├── FeatureGate.tsx                 # Feature gating component
│   ├── SubscriptionProvider.tsx        # Context provider
│   └── SubscriptionExamples.tsx        # Integration examples
└── scripts/
    └── seed-subscriptions.js           # Seeding script runner
```

## 🗄️ Database Schema

### Collections Created
- `subscriptionPlans` - Admin-configurable subscription plans
- `subscriptionFeatures` - Comprehensive feature definitions (25+ features)
- `subscriptionConfig` - Global platform configuration
- `organizationSubscriptions` - Active organization subscriptions
- `userSubscriptions` - Active individual user subscriptions  
- `usageEvents` - Usage tracking events and analytics

### Updated Collections
- `users` - Added `currentPlan` and `subscriptionId` fields
- `organizations` - Added `currentPlan` and `subscriptionId` fields

## ⚙️ Setup & Installation

### 1. Database Seeding
Run the seeding script to populate default plans and features:

```bash
node scripts/seed-subscriptions.js
```

This creates:
- **4 subscription plans** (Free, Pro $29/mo, Team $99/mo, Enterprise $299/mo)
- **25+ features** across 8 categories
- **Global configuration** with sensible defaults

### 2. API Routes (To Be Implemented)
The system expects these API routes to be implemented:

```
/api/subscription/
├── plans/                    # GET - List all plans
├── plans/[id]               # GET - Get specific plan
├── organizations/[id]        # GET/POST - Org subscription management
├── users/[id]               # GET/POST - User subscription management
├── feature-access           # GET/POST - Feature access checking
├── usage/                   # POST - Track usage, GET - Usage data
└── billing/                 # POST - Stripe integration
```

### 3. Environment Variables
Add to your `.env.local`:

```env
# Existing Firebase config...

# Stripe Integration (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🎯 Usage Examples

### Basic Feature Gating

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate';

function AdvancedTestingPanel() {
  return (
    <FeatureGate featureId="advanced-evaluators">
      <div>
        <h3>Advanced Test Evaluators</h3>
        <p>Configure sentiment analysis, JSON validation, and custom evaluators</p>
        <Button>Configure Evaluators</Button>
      </div>
    </FeatureGate>
  );
}
```

### Usage Tracking

```tsx
import { useFeatureAccess } from '@/hooks/use-subscription';

function PromptExecutor() {
  const { trackUsage } = useFeatureAccess('prompt-executions');
  
  const executePrompt = async () => {
    const success = await trackUsage(1, {
      promptId: 'example-prompt',
      modelUsed: 'gpt-4'
    });
    
    if (success) {
      // Execute the prompt
      console.log('Prompt executed successfully');
    } else {
      console.log('Usage limit exceeded');
    }
  };

  return <Button onClick={executePrompt}>Execute Prompt</Button>;
}
```

### Subscription Management

```tsx
import { useSubscription } from '@/hooks/use-subscription';

function SubscriptionDashboard() {
  const { 
    plan, 
    isTrialing, 
    trialDaysRemaining, 
    upgradePlan 
  } = useSubscription();

  return (
    <div>
      <h2>Current Plan: {plan?.name}</h2>
      {isTrialing && (
        <p>Trial expires in {trialDaysRemaining} days</p>
      )}
      <Button onClick={() => upgradePlan('pro-plan')}>
        Upgrade to Pro
      </Button>
    </div>
  );
}
```

### Context Provider Setup

```tsx
import { SubscriptionProvider } from '@/components/subscription/SubscriptionProvider';

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <YourAppComponents />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
```

## 🔧 Admin Configuration

The system is designed to be fully configurable by platform administrators through the admin panel:

### Subscription Plans
- **Flexible Pricing**: Configure price, billing period, currency
- **Feature Selection**: Choose which features are included in each plan
- **Usage Limits**: Set specific limits for each plan tier
- **Trial Configuration**: Enable/disable trials, set duration and restrictions

### Features Management
- **25+ Pre-defined Features**: Ready to use across 8 categories
- **Custom Features**: Add new features through the admin interface
- **Feature Metadata**: Configure descriptions, tooltips, icons, and sorting

### Usage Limits
Configure granular limits for:
- Projects per organization (Free: 3, Pro: 25, Team: 100, Enterprise: Unlimited)
- Prompts per project (Free: 10, Pro: 100, Team: 500, Enterprise: Unlimited)
- Monthly executions (Free: 1K, Pro: 10K, Team: 50K, Enterprise: Unlimited)
- Monthly tokens (Free: 100K, Pro: 1M, Team: 10M, Enterprise: Unlimited)
- Team members, API keys, test runs, and more...

## 🏗️ Architecture

### Service Layer
- **SubscriptionService**: Manages subscription lifecycle and billing
- **FeatureGateService**: Handles feature access checking with caching
- **UsageTrackingService**: Monitors usage and enforces limits

### React Integration
- **Hooks**: `useSubscription`, `useFeatureAccess`, `useUsageTracking`
- **Components**: `FeatureGate`, `SubscriptionProvider`, example components
- **Context**: Global subscription state management

### Data Flow
1. **Admin Configuration**: Configure plans and features through admin panel
2. **User Subscription**: Users subscribe to plans or start trials
3. **Feature Access**: Components check feature access before rendering
4. **Usage Tracking**: System tracks usage and enforces limits
5. **Billing Integration**: Stripe integration for payment processing

## 🎨 Default Subscription Plans

### Free Plan - $0/month
- 3 projects, 10 prompts per project
- 1,000 monthly executions, 100K tokens
- 50 test runs, basic features only
- 1 API key, 7-day history

### Pro Plan - $29/month
- 25 projects, 100 prompts per project
- 10,000 monthly executions, 1M tokens
- Advanced evaluators, A/B testing, model recommendations
- 5 API keys, 30-day history, email support
- **14-day trial available**

### Team Plan - $99/month
- 100 projects, 500 prompts per project
- 50,000 monthly executions, 10M tokens
- Up to 25 team members, role management
- Webhooks, advanced analytics, priority support
- **30-day trial available**

### Enterprise Plan - $299/month
- Unlimited projects, prompts, executions
- Unlimited team members, advanced security
- SSO, audit logs, dedicated support
- Custom integrations, white-label branding
- **30-day trial available**

## 🔒 Security & Compliance

### Built-in Security Features
- **Role-based Access Control**: Granular permissions for team members
- **Usage Monitoring**: Track all feature usage and API calls
- **Audit Logs**: Comprehensive logging for enterprise customers
- **Data Encryption**: Enhanced encryption for sensitive data

### Enterprise Features
- **SSO Integration**: SAML and OAuth support
- **IP Whitelisting**: Restrict access by IP address
- **Custom Integrations**: Dedicated support for custom connections
- **Compliance**: Built-in support for security audits

## 📊 Analytics & Monitoring

### Usage Analytics
- **Real-time Tracking**: Monitor feature usage across all plans  
- **Trend Analysis**: Identify usage patterns and optimize limits
- **Billing Insights**: Track revenue and subscription metrics
- **Performance Monitoring**: Monitor system performance and bottlenecks

### Admin Dashboard Metrics
- Total subscriptions by plan
- Monthly recurring revenue
- Trial conversion rates
- Most popular features
- Usage limit warnings

## 🚀 Next Steps

### Immediate Implementation Needed
1. **API Routes**: Implement the subscription API endpoints
2. **Stripe Integration**: Set up payment processing
3. **Admin Panel**: Create admin interface for plan/feature management
4. **Billing Webhooks**: Handle subscription status changes

### Future Enhancements
1. **Usage-based Billing**: Implement pay-per-use pricing models
2. **Custom Plans**: Allow enterprise customers to create custom plans
3. **Reseller Program**: Multi-tenant support for resellers
4. **Advanced Analytics**: More detailed usage and performance analytics

## 🤝 Integration with Existing Features

The subscription system integrates seamlessly with existing Prompt Guru features:

- **Playground**: Gate advanced AI features like model recommendations
- **Testing Framework**: Restrict advanced evaluators and A/B testing
- **Analytics**: Limit retention periods and export capabilities  
- **Team Features**: Control member limits and collaboration features
- **API Access**: Manage API key limits and rate limiting
- **Webhooks**: Control webhook usage and integration capabilities

This comprehensive system provides a solid foundation for monetizing Prompt Guru while maintaining flexibility for future growth and feature additions.