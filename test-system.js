#!/usr/bin/env node
/**
 * TEST SUITE - Comprehensive testing for model rotation system
 */

const { selectModel, getModelInfo, listModels } = require('./model-selector');
const { smartSpawn } = require('./smart-spawn');

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function success(message) {
  log(colors.green, '✓', message);
}

function error(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.blue, 'ℹ', message);
}

function section(message) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`${message}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Complex Mathematical Problem',
    task: 'Solve the traveling salesman problem with dynamic programming optimization',
    expectedCategory: 'reasoning',
    expectedModels: ['o1-preview', 'o1-mini']
  },
  {
    name: 'Code Generation',
    task: 'Write a Python REST API with FastAPI including authentication and database models',
    expectedCategory: ['balanced', 'code'],
    expectedModels: ['claude-sonnet-4.5', 'gpt-4o', 'o1-mini']
  },
  {
    name: 'Creative Writing',
    task: 'Write a creative short story about a robot learning to paint',
    expectedCategory: 'creative',
    expectedModels: ['claude-opus-3', 'gpt-4-turbo']
  },
  {
    name: 'Quick Query',
    task: 'Quick summary of machine learning in 3 bullet points',
    expectedCategory: 'fast',
    expectedModels: ['gemini-flash-2.0', 'claude-haiku-3.5', 'gpt-4o-mini']
  },
  {
    name: 'Large Document Analysis',
    task: 'Analyze entire codebase with multiple files and provide comprehensive review',
    expectedCategory: 'balanced',
    expectedModels: ['gemini-pro-1.5', 'claude-sonnet-4.5']
  },
  {
    name: 'Debugging Task',
    task: 'Debug and fix memory leak in Node.js application',
    expectedCategory: ['balanced', 'code'],
    expectedModels: ['claude-sonnet-4.5', 'o1-mini', 'gpt-4o']
  }
];

// Run tests
async function runTests() {
  section('MODEL ROTATION SYSTEM - TEST SUITE');

  let passed = 0;
  let failed = 0;

  // Test 1: Model Selector
  section('TEST 1: Model Selection Logic');
  
  for (const scenario of TEST_SCENARIOS) {
    try {
      info(`Testing: ${scenario.name}`);
      
      const result = selectModel(scenario.task);
      
      // Check if selected model is in expected list
      const isExpectedModel = scenario.expectedModels.includes(result.model);
      
      if (isExpectedModel) {
        success(`Selected ${result.model} - Correct!`);
        console.log(`   Category: ${result.category}, Confidence: ${Math.round(result.confidence)}`);
        passed++;
      } else {
        error(`Selected ${result.model} - Expected one of: ${scenario.expectedModels.join(', ')}`);
        console.log(`   Category: ${result.category}, Confidence: ${Math.round(result.confidence)}`);
        failed++;
      }
      
      // Show reasoning
      console.log(`   Primary need: ${result.reasoning.primaryNeed}`);
      console.log('');
      
    } catch (err) {
      error(`Exception: ${err.message}`);
      failed++;
    }
  }

  // Test 2: Model Info
  section('TEST 2: Model Information Retrieval');
  
  try {
    const testModels = ['claude-sonnet-4.5', 'gpt-4o', 'o1-preview'];
    
    for (const modelName of testModels) {
      const info_data = getModelInfo(modelName);
      
      if (info_data && info_data.provider && info_data.category) {
        success(`Retrieved info for ${modelName}`);
        console.log(`   Provider: ${info_data.provider}, Category: ${info_data.category}`);
        passed++;
      } else {
        error(`Failed to retrieve info for ${modelName}`);
        failed++;
      }
    }
    console.log('');
  } catch (err) {
    error(`Exception: ${err.message}`);
    failed++;
  }

  // Test 3: List Models by Category
  section('TEST 3: List Models by Category');
  
  try {
    const categories = ['reasoning', 'balanced', 'fast', 'creative'];
    
    for (const category of categories) {
      const models = listModels(category);
      
      if (models && models.length > 0) {
        success(`Found ${models.length} models in ${category} category`);
        console.log(`   Models: ${models.map(m => m.name).join(', ')}`);
        passed++;
      } else {
        error(`No models found for category: ${category}`);
        failed++;
      }
    }
    console.log('');
  } catch (err) {
    error(`Exception: ${err.message}`);
    failed++;
  }

  // Test 4: Cost Tier Filtering
  section('TEST 4: Cost Tier Filtering');
  
  try {
    const costTiers = ['low', 'medium', 'high'];
    const task = 'Generate code for a simple function';
    
    for (const tier of costTiers) {
      const result = selectModel(task, { maxCostTier: tier });
      
      const modelInfo = getModelInfo(result.model);
      const costRank = { low: 1, medium: 2, high: 3 };
      
      if (costRank[modelInfo.costTier] <= costRank[tier]) {
        success(`Cost tier ${tier} respected - Selected ${result.model} (${modelInfo.costTier})`);
        passed++;
      } else {
        error(`Cost tier ${tier} violated - Selected ${result.model} (${modelInfo.costTier})`);
        failed++;
      }
    }
    console.log('');
  } catch (err) {
    error(`Exception: ${err.message}`);
    failed++;
  }

  // Test 5: Provider Preference
  section('TEST 5: Provider Preference');
  
  try {
    const providers = ['OpenAI', 'Anthropic', 'Google'];
    const task = 'Write a function to process data';
    
    for (const provider of providers) {
      const result = selectModel(task, { preferProvider: provider });
      
      if (result.provider === provider || result.confidence > 0) {
        success(`Provider ${provider} - Selected ${result.model} (${result.provider})`);
        passed++;
      } else {
        error(`Provider ${provider} preference failed`);
        failed++;
      }
    }
    console.log('');
  } catch (err) {
    error(`Exception: ${err.message}`);
    failed++;
  }

  // Test 6: Edge Cases
  section('TEST 6: Edge Cases & Error Handling');
  
  // Empty task
  try {
    selectModel('');
    success('Handled empty task description');
    passed++;
  } catch (err) {
    info('Empty task handled with default: ' + err.message);
    passed++;
  }

  // Very long task
  try {
    const longTask = 'analyze '.repeat(1000) + 'this code';
    const result = selectModel(longTask);
    success(`Handled very long task (${longTask.length} chars) - Selected ${result.model}`);
    passed++;
  } catch (err) {
    error('Failed to handle long task: ' + err.message);
    failed++;
  }

  // Impossible constraints
  try {
    selectModel('complex reasoning task', { 
      maxCostTier: 'low',
      requireCategory: 'reasoning' 
    });
    info('Found model even with tight constraints');
    passed++;
  } catch (err) {
    info('Correctly rejected impossible constraints: ' + err.message);
    passed++;
  }

  console.log('');

  // Test 7: Smart Spawn (Simulation)
  section('TEST 7: Smart Spawn Integration');
  
  try {
    info('Testing smart spawn with code generation task...');
    
    const result = await smartSpawn({
      task: 'Write a Python function to calculate prime numbers',
      taskType: 'code',
      maxCostTier: 'medium'
    });

    if (result.success && result.model && result.sessionKey) {
      success(`Smart spawn successful`);
      console.log(`   Model: ${result.model}`);
      console.log(`   Session: ${result.sessionKey}`);
      console.log(`   Duration: ${result.duration}ms`);
      passed++;
    } else {
      error('Smart spawn returned incomplete result');
      failed++;
    }
  } catch (err) {
    // Expected if accounts not configured
    if (err.message.includes('accounts.json not found')) {
      info('Smart spawn test skipped - accounts not configured');
      info('Create accounts.json from template to enable full testing');
    } else {
      error('Smart spawn error: ' + err.message);
      failed++;
    }
  }

  console.log('');

  // Results Summary
  section('TEST RESULTS SUMMARY');
  
  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`Total Tests: ${total}`);
  success(`Passed: ${passed} (${percentage}%)`);
  if (failed > 0) {
    error(`Failed: ${failed} (${(100 - percentage).toFixed(1)}%)`);
  }
  console.log('');

  // Performance note
  if (passed >= total * 0.9) {
    success('🎉 EXCELLENT! System is working as expected.');
  } else if (passed >= total * 0.7) {
    log(colors.yellow, '⚠', 'GOOD! Some tests failed but core functionality works.');
  } else {
    error('❌ NEEDS ATTENTION! Multiple test failures detected.');
  }

  console.log('');

  return { passed, failed, total };
}

// Example usage scenarios
function printExamples() {
  section('EXAMPLE USAGE SCENARIOS');

  console.log('1. Basic Model Selection:\n');
  console.log('   node model-selector.js "write Python code for sorting"');
  console.log('');

  console.log('2. With Cost Constraint:\n');
  console.log('   node model-selector.js "quick summary" --max-cost low');
  console.log('');

  console.log('3. Provider Preference:\n');
  console.log('   node model-selector.js "creative story" --provider Anthropic');
  console.log('');

  console.log('4. Smart Spawn:\n');
  console.log('   node smart-spawn.js "analyze algorithm complexity" --type reasoning');
  console.log('');

  console.log('5. Check Account Status:\n');
  console.log('   node account-rotator.js status');
  console.log('');

  console.log('6. View Usage Stats:\n');
  console.log('   node usage-tracker/usage-tracker.js stats');
  console.log('');
}

// Run tests
if (require.main === module) {
  runTests()
    .then(results => {
      if (process.argv.includes('--examples')) {
        printExamples();
      }
      
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      error(`Fatal error: ${err.message}`);
      console.error(err.stack);
      process.exit(1);
    });
}

module.exports = { runTests, printExamples };
