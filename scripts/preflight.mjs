#!/usr/bin/env node
import { config } from 'dotenv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

// Load .env from repo root
config({ path: resolve('.env') });

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const RUNNER_OUTPUTS = 'apps/runner/runtime_outputs';

console.log('🔍 FinSage Preflight Check\n');

// 1. Check backend health
console.log('1️⃣ Checking backend health...');
try {
  const response = await fetch(`${BACKEND_URL}/health`);
  const health = await response.json();
  
  if (health.ok && typeof health.stub === 'boolean') {
    console.log(`   ✅ Backend healthy (stub: ${health.stub})`);
  } else {
    throw new Error(`Invalid health response: ${JSON.stringify(health)}`);
  }
} catch (error) {
  console.error(`   ❌ Backend health check failed: ${error.message}`);
  process.exit(1);
}

// 2. Run runner suggest command
console.log('\n2️⃣ Running runner suggest...');
try {
  execSync('npm -w apps/runner run suggest', { 
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('   ✅ Runner suggest completed');
} catch (error) {
  console.error(`   ❌ Runner suggest failed: ${error.message}`);
  process.exit(1);
}

// 3. Find newest JSON output
console.log('\n3️⃣ Finding newest output...');
const outputFiles = readdirSync(RUNNER_OUTPUTS)
  .filter(f => f.endsWith('.json'))
  .map(f => ({
    name: f,
    path: join(RUNNER_OUTPUTS, f),
    mtime: statSync(join(RUNNER_OUTPUTS, f)).mtime
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (outputFiles.length === 0) {
  console.error('   ❌ No JSON outputs found');
  process.exit(1);
}

const newestFile = outputFiles[0];
console.log(`   ✅ Found: ${newestFile.name}`);

// 4. Validate JSON schema
console.log('\n4️⃣ Validating JSON schema...');
try {
  const jsonContent = readFileSync(newestFile.path, 'utf8');
  const data = JSON.parse(jsonContent);
  
  // Basic schema validation
  const required = ['status', 'mode', 'universe', 'signals', 'suggestions'];
  const missing = required.filter(field => !(field in data));
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (data.status !== 'ok') {
    throw new Error(`Status is not 'ok': ${data.status}`);
  }
  
  console.log('   ✅ JSON schema valid');
} catch (error) {
  console.error(`   ❌ JSON validation failed: ${error.message}`);
  process.exit(1);
}

// 5. Print summary
console.log('\n📊 Summary Table');
console.log('┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────────┐');
console.log('│ Status      │ Mode        │ Universe    │ Signals     │ Suggestions│ Last Output             │');
console.log('├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────────────────┤');

const data = JSON.parse(readFileSync(newestFile.path, 'utf8'));
const status = data.status || 'unknown';
const mode = data.mode || 'unknown';
const universe = Array.isArray(data.universe) ? data.universe.length : 0;
const signals = Array.isArray(data.signals) ? data.signals.length : 0;
const suggestions = Array.isArray(data.suggestions) ? data.suggestions.length : 0;
const outputPath = newestFile.name;

console.log(`│ ${status.padEnd(11)} │ ${mode.padEnd(11)} │ ${universe.toString().padEnd(11)} │ ${signals.toString().padEnd(11)} │ ${suggestions.toString().padEnd(11)} │ ${outputPath.padEnd(23)} │`);
console.log('└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────────────────┘');

console.log('\n🎉 All checks passed! Loop is solid.');
console.log('\n📱 Next steps:');
console.log('   • Open: http://localhost:3000');
console.log('   • Click any source_ref chip to test');
console.log('   • Check backend logs for tool execution');
