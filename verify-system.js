#!/usr/bin/env node
/**
 * SYSTEM VERIFICATION
 * Verifies that the complete multi-account rotation system is correctly built
 * 
 * Usage: node verify-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  GITHUB COPILOT MULTI-ACCOUNT SYSTEM VERIFICATION         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const checks = [];

// Check 1: Core modules
console.log('1️⃣ Checking Core Modules...\n');

const coreModules = [
  'copilot-token-collector.js',
  'intelligent-rotator.js',
  'openclaw-copilot-integration.js',
  'capability-detector.js',
  'setup-copilot-multi-account.js'
];

coreModules.forEach(module => {
  const exists = fs.existsSync(path.join(__dirname, module));
  const executable = exists && (fs.statSync(path.join(__dirname, module)).mode & 0o111) !== 0;
  
  checks.push({
    name: module,
    status: exists && executable,
    message: exists ? (executable ? 'Ready' : 'Not executable') : 'Missing'
  });
  
  const icon = exists && executable ? '✅' : '❌';
  console.log(`   ${icon} ${module.padEnd(35)} ${exists && executable ? 'Ready' : 'Missing/Not executable'}`);
});

// Check 2: Documentation
console.log('\n2️⃣ Checking Documentation...\n');

const docs = [
  'COPILOT-MULTI-ACCOUNT.md',
  'README-COPILOT.md',
  'BUILD-COMPLETE.md'
];

docs.forEach(doc => {
  const exists = fs.existsSync(path.join(__dirname, doc));
  
  checks.push({
    name: doc,
    status: exists,
    message: exists ? 'Present' : 'Missing'
  });
  
  const icon = exists ? '✅' : '❌';
  console.log(`   ${icon} ${doc.padEnd(35)} ${exists ? 'Present' : 'Missing'}`);
});

// Check 3: Dependencies
console.log('\n3️⃣ Checking Dependencies...\n');

const dependencies = [
  { name: 'accounts.json', path: 'accounts.json' },
  { name: 'github-auth-collector.js', path: 'github-auth-collector.js' }
];

dependencies.forEach(dep => {
  const exists = fs.existsSync(path.join(__dirname, dep.path));
  
  checks.push({
    name: dep.name,
    status: exists,
    message: exists ? 'Present' : 'Missing'
  });
  
  const icon = exists ? '✅' : '⚠️';
  console.log(`   ${icon} ${dep.name.padEnd(35)} ${exists ? 'Present' : 'Missing (run setup to create)'}`);
});

// Check 4: Data files
console.log('\n4️⃣ Checking Data Files (created after setup)...\n');

const dataFiles = [
  'copilot-tokens.json',
  'rotation-log.json',
  'openclaw-integration.log',
  'capabilities-report.json'
];

dataFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  const icon = exists ? '✅' : '⏳';
  const status = exists ? 'Present' : 'Will be created by setup';
  console.log(`   ${icon} ${file.padEnd(35)} ${status}`);
});

// Check 5: Module functionality
console.log('\n5️⃣ Checking Module Functionality...\n');

const functionalityChecks = [];

// Test token collector
try {
  const tokenCollector = require('./copilot-token-collector.js');
  functionalityChecks.push({
    name: 'Token Collector Module',
    status: typeof tokenCollector.collectAllTokens === 'function',
    message: 'Exports correct functions'
  });
} catch (error) {
  functionalityChecks.push({
    name: 'Token Collector Module',
    status: false,
    message: `Import error: ${error.message}`
  });
}

// Test rotator
try {
  const rotator = require('./intelligent-rotator.js');
  functionalityChecks.push({
    name: 'Intelligent Rotator Module',
    status: typeof rotator.selectBestAccount === 'function',
    message: 'Exports correct functions'
  });
} catch (error) {
  functionalityChecks.push({
    name: 'Intelligent Rotator Module',
    status: false,
    message: `Import error: ${error.message}`
  });
}

// Test integration
try {
  const integration = require('./openclaw-copilot-integration.js');
  functionalityChecks.push({
    name: 'OpenClaw Integration Module',
    status: typeof integration.enable === 'function',
    message: 'Exports correct functions'
  });
} catch (error) {
  functionalityChecks.push({
    name: 'OpenClaw Integration Module',
    status: false,
    message: `Import error: ${error.message}`
  });
}

// Test capability detector
try {
  const detector = require('./capability-detector.js');
  functionalityChecks.push({
    name: 'Capability Detector Module',
    status: typeof detector.testAllAccounts === 'function',
    message: 'Exports correct functions'
  });
} catch (error) {
  functionalityChecks.push({
    name: 'Capability Detector Module',
    status: false,
    message: `Import error: ${error.message}`
  });
}

// Test setup wizard
try {
  const setup = require('./setup-copilot-multi-account.js');
  functionalityChecks.push({
    name: 'Setup Wizard Module',
    status: typeof setup.main === 'function',
    message: 'Exports correct functions'
  });
} catch (error) {
  functionalityChecks.push({
    name: 'Setup Wizard Module',
    status: false,
    message: `Import error: ${error.message}`
  });
}

functionalityChecks.forEach(check => {
  const icon = check.status ? '✅' : '❌';
  console.log(`   ${icon} ${check.name.padEnd(35)} ${check.message}`);
});

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const allChecks = [...checks, ...functionalityChecks];
const passed = allChecks.filter(c => c.status).length;
const total = allChecks.length;
const percentage = ((passed / total) * 100).toFixed(1);

console.log('📊 VERIFICATION SUMMARY:\n');
console.log(`   Total checks: ${total}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${total - passed}`);
console.log(`   Success rate: ${percentage}%\n`);

if (passed === total) {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('🚀 System is ready to use. Run:\n');
  console.log('   node setup-copilot-multi-account.js\n');
} else {
  console.log('⚠️  Some checks failed. Review the issues above.\n');
  
  const failed = allChecks.filter(c => !c.status);
  if (failed.length > 0) {
    console.log('❌ Failed checks:');
    failed.forEach(f => {
      console.log(`   • ${f.name}: ${f.message}`);
    });
    console.log('');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Exit code
process.exit(passed === total ? 0 : 1);
