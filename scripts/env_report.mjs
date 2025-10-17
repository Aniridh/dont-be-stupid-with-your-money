#!/usr/bin/env node
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env from repo root
const envPath = resolve('.env');
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  console.log('⚠️  No .env file found, using system environment variables\n');
}

console.log('🔍 FinSage Environment Report\n');

// Check STUB_MODE
const stubMode = process.env.STUB_MODE === 'true';
console.log(`📊 Mode: ${stubMode ? 'STUB (test data)' : 'LIVE (real APIs)'}\n`);

// Define all environment variables and their purposes
const envVars = [
  {
    key: 'STUB_MODE',
    required: true,
    purpose: 'Controls whether to use test data (true) or real APIs (false)',
    category: 'Core'
  },
  {
    key: 'NEXT_PUBLIC_BACKEND_URL',
    required: true,
    purpose: 'Frontend URL to backend server',
    category: 'Core'
  },
  {
    key: 'GEMINI_API_KEY',
    required: !stubMode,
    purpose: 'Google Gemini API key for LLM agent functionality',
    category: 'LLM'
  },
  {
    key: 'OPENAI_API_KEY',
    required: false,
    purpose: 'Alternative to Gemini for LLM agent functionality',
    category: 'LLM'
  },
  {
    key: 'APIFY_TOKEN',
    required: !stubMode,
    purpose: 'Apify token for live news scraping',
    category: 'News'
  },
  {
    key: 'APIFY_ACTOR_ID',
    required: !stubMode,
    purpose: 'Apify actor ID for news scraping pipeline',
    category: 'News'
  },
  {
    key: 'TRUEFOUNDRY_API_KEY',
    required: false,
    purpose: 'TrueFoundry API key for model hosting and AI gateway',
    category: 'Infrastructure'
  },
  {
    key: 'AIRIA_API_KEY',
    required: false,
    purpose: 'Airia API key for agent orchestration and workflow management',
    category: 'Infrastructure'
  },
  {
    key: 'SENTRY_DSN',
    required: false,
    purpose: 'Sentry DSN for error monitoring and telemetry',
    category: 'Monitoring'
  },
  {
    key: 'NEWS_API_KEY',
    required: false,
    purpose: 'Alternative news API key (if not using Apify)',
    category: 'News'
  },
  {
    key: 'REDPANDA_BROKERS',
    required: false,
    purpose: 'Redpanda brokers for event streaming (optional)',
    category: 'Infrastructure'
  }
];

// Group by category
const categories = {};
envVars.forEach(envVar => {
  if (!categories[envVar.category]) {
    categories[envVar.category] = [];
  }
  categories[envVar.category].push(envVar);
});

// Check each variable
let allRequiredSet = true;
const missingRequired = [];

console.log('🔑 Environment Variables Status:\n');

Object.entries(categories).forEach(([category, vars]) => {
  console.log(`📂 ${category}:`);
  
  vars.forEach(envVar => {
    const isSet = !!process.env[envVar.key];
    const isRequired = envVar.required;
    const status = isSet ? '✅' : (isRequired ? '❌' : '⚪');
    const requiredText = isRequired ? ' (REQUIRED)' : ' (optional)';
    
    console.log(`  ${status} ${envVar.key}${requiredText}`);
    console.log(`     Purpose: ${envVar.purpose}`);
    
    if (isSet) {
      // Show first few characters of the key for verification
      const value = process.env[envVar.key];
      const masked = value.length > 8 ? 
        value.substring(0, 4) + '...' + value.substring(value.length - 4) : 
        '***';
      console.log(`     Value: ${masked}`);
    } else if (isRequired) {
      missingRequired.push(envVar);
      allRequiredSet = false;
    }
    console.log('');
  });
});

// Summary
console.log('📋 Summary:');
if (allRequiredSet) {
  console.log('✅ All required environment variables are set!');
  if (stubMode) {
    console.log('🔧 Ready for STUB mode development');
  } else {
    console.log('🚀 Ready for LIVE mode with real APIs');
  }
} else {
  console.log('❌ Missing required environment variables:');
  missingRequired.forEach(envVar => {
    console.log(`   • ${envVar.key}: ${envVar.purpose}`);
  });
  console.log('\n💡 Tip: Copy .env.example to .env and fill in your keys');
}

// Next steps
console.log('\n🎯 Next Steps:');
if (stubMode) {
  console.log('1. Run: npm run dev:all');
  console.log('2. Open: http://localhost:3000');
  console.log('3. Test: npm run preflight');
} else {
  console.log('1. Ensure all required keys are set');
  console.log('2. Run: npm run dev:all');
  console.log('3. Open: http://localhost:3000');
  console.log('4. Test: npm run preflight');
}

console.log('\n📚 For more info:');
console.log('   • README.md - Quickstart guide');
console.log('   • docs/ - Detailed documentation');
console.log('   • .env.example - Template with all variables');
