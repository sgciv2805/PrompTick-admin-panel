/*
  Inspect Firestore data for AI configs vs usage stats.
  This script does NOT change any data. It prints:
  - Number of configs
  - Number of aiUsageStats docs
  - Per-useCaseId match status and field types
*/

require('dotenv').config({ path: './.env.local' });

const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

function initAdmin() {
  let app;
  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if ((keyString.startsWith('"') && keyString.endsWith('"')) || (keyString.startsWith("'") && keyString.endsWith("'"))) {
        keyString = keyString.slice(1, -1);
      }
      keyString = keyString.replace(/\\"/g, '"').replace(/\\'/g, "'");
      const key = JSON.parse(keyString);
      credential = cert(key);
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      credential = cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else {
      credential = applicationDefault();
    }
    app = initializeApp({ credential, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  } catch (e) {
    console.error('Failed to init Firebase Admin:', e.message);
    process.exit(1);
  }
  return getFirestore(app);
}

function typeOf(v) {
  if (v && typeof v.toDate === 'function') return 'Timestamp';
  if (v === null) return 'null';
  return Array.isArray(v) ? 'array' : typeof v;
}

async function run() {
  const db = initAdmin();

  const [configsSnap, usageSnap] = await Promise.all([
    db.collection('aiUseCaseConfigs').get(),
    db.collection('aiUsageStats').get(),
  ]);

  const configs = configsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const usage = usageSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const useCaseIds = new Set(configs.map(c => c.useCaseId || c.id));
  const usageByUseCaseId = new Map();
  usage.forEach(u => usageByUseCaseId.set(u.useCaseId, u));

  const missingStats = [];
  const typeIssues = [];
  let totalCalls = 0;
  let totalCost = 0;

  for (const config of configs) {
    const key = config.useCaseId || config.id;
    const stat = usageByUseCaseId.get(key);
    if (!stat) {
      missingStats.push(key);
      continue;
    }
    totalCalls += Number(stat.totalExecutions || 0);
    totalCost += Number(stat.totalCost || 0);

    const fields = ['totalExecutions','successfulExecutions','failedExecutions','totalTokens','totalCost','avgLatencyMs','firstExecutionAt','lastExecutionAt'];
    for (const f of fields) {
      const t = typeOf(stat[f]);
      if ((['totalExecutions','successfulExecutions','failedExecutions','totalTokens','totalCost','avgLatencyMs'].includes(f) && t !== 'number') ||
          (['firstExecutionAt','lastExecutionAt'].includes(f) && t !== 'Timestamp')) {
        typeIssues.push({ useCaseId: key, field: f, type: t, value: stat[f] });
      }
    }
  }

  console.log('Configs:', configs.length);
  console.log('aiUsageStats docs:', usage.length);
  console.log('Missing stats for useCaseIds:', missingStats);
  console.log('Type issues (expected numbers or Timestamps):');
  console.table(typeIssues.slice(0, 20));
  console.log('Aggregated totalExecutions:', totalCalls);
  console.log('Aggregated totalCost:', totalCost);
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });



