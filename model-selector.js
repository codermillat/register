#!/usr/bin/env node
/**
 * MODEL SELECTOR - Intelligent model selection based on task requirements
 * Usage: node model-selector.js "task description"
 * Or: const { selectModel } = require('./model-selector.js');
 */

const MODEL_REGISTRY = {
  // Heavy Reasoning Models
  'o1-preview': {
    provider: 'OpenAI',
    category: 'reasoning',
    strength: 95,
    speed: 20,
    creativity: 70,
    code: 85,
    costTier: 'high',
    contextWindow: 128000,
    bestFor: ['complex problem solving', 'mathematical reasoning', 'deep analysis', 'multi-step logic']
  },
  'o1-mini': {
    provider: 'OpenAI',
    category: 'reasoning',
    strength: 85,
    speed: 40,
    creativity: 65,
    code: 80,
    costTier: 'medium',
    contextWindow: 128000,
    bestFor: ['coding challenges', 'technical analysis', 'structured reasoning', 'optimization problems']
  },
  
  // Balanced Models
  'claude-sonnet-4.5': {
    provider: 'Anthropic',
    category: 'balanced',
    strength: 90,
    speed: 70,
    creativity: 85,
    code: 90,
    costTier: 'medium',
    contextWindow: 200000,
    bestFor: ['code generation', 'technical writing', 'analysis', 'general tasks', 'long context']
  },
  'gpt-4o': {
    provider: 'OpenAI',
    category: 'balanced',
    strength: 88,
    speed: 65,
    creativity: 80,
    code: 85,
    costTier: 'medium',
    contextWindow: 128000,
    bestFor: ['multimodal tasks', 'general assistance', 'structured output', 'vision tasks']
  },
  'gemini-pro-1.5': {
    provider: 'Google',
    category: 'balanced',
    strength: 85,
    speed: 75,
    creativity: 78,
    code: 82,
    costTier: 'medium',
    contextWindow: 1000000,
    bestFor: ['massive context', 'document analysis', 'multi-file processing']
  },
  
  // Fast/Simple Models
  'gpt-4o-mini': {
    provider: 'OpenAI',
    category: 'fast',
    strength: 70,
    speed: 95,
    creativity: 70,
    code: 75,
    costTier: 'low',
    contextWindow: 128000,
    bestFor: ['quick queries', 'simple tasks', 'rapid prototyping', 'batch processing']
  },
  'claude-haiku-3.5': {
    provider: 'Anthropic',
    category: 'fast',
    strength: 72,
    speed: 98,
    creativity: 68,
    code: 78,
    costTier: 'low',
    contextWindow: 200000,
    bestFor: ['fast responses', 'simple coding', 'data processing', 'quick analysis']
  },
  'gemini-flash-2.0': {
    provider: 'Google',
    category: 'fast',
    strength: 68,
    speed: 99,
    creativity: 65,
    code: 70,
    costTier: 'low',
    contextWindow: 1000000,
    bestFor: ['speed-critical tasks', 'simple queries', 'large document scanning']
  },
  
  // Code Specialists
  'claude-opus-3': {
    provider: 'Anthropic',
    category: 'creative',
    strength: 92,
    speed: 50,
    creativity: 95,
    code: 88,
    costTier: 'high',
    contextWindow: 200000,
    bestFor: ['creative writing', 'complex code', 'nuanced analysis', 'research']
  },
  'gpt-4-turbo': {
    provider: 'OpenAI',
    category: 'creative',
    strength: 87,
    speed: 60,
    creativity: 90,
    code: 83,
    costTier: 'high',
    contextWindow: 128000,
    bestFor: ['creative projects', 'brainstorming', 'storytelling', 'detailed explanations']
  }
};

// Task pattern matching keywords
const TASK_PATTERNS = {
  reasoning: [
    'solve', 'prove', 'calculate', 'analyze deeply', 'mathematical',
    'logic puzzle', 'theorem', 'complex problem', 'multi-step',
    'reasoning', 'proof', 'derivation', 'optimize', 'algorithm design'
  ],
  code: [
    'code', 'program', 'function', 'class', 'debug', 'refactor',
    'implement', 'script', 'api', 'database', 'algorithm',
    'software', 'application', 'backend', 'frontend', 'fix bug'
  ],
  creative: [
    'write story', 'creative', 'brainstorm', 'imagine', 'narrative',
    'poem', 'fiction', 'blog post', 'article', 'essay',
    'marketing copy', 'content', 'storytelling', 'character'
  ],
  fast: [
    'quick', 'simple', 'summarize', 'list', 'brief',
    'fast', 'rapid', 'simple question', 'what is', 'define',
    'tldr', 'overview', 'bullet points'
  ],
  balanced: [
    'explain', 'help', 'create', 'generate', 'write',
    'design', 'plan', 'review', 'improve', 'suggest'
  ],
  longContext: [
    'analyze document', 'review codebase', 'entire file',
    'multiple files', 'long document', 'comprehensive review',
    'full context', 'all files'
  ]
};

/**
 * Analyze task description and return requirement scores
 */
function analyzeTask(taskDescription) {
  const desc = taskDescription.toLowerCase();
  const scores = {
    reasoning: 0,
    code: 0,
    creative: 0,
    speed: 0,
    balanced: 0,
    longContext: 0
  };

  // Count pattern matches
  for (const [category, patterns] of Object.entries(TASK_PATTERNS)) {
    for (const pattern of patterns) {
      if (desc.includes(pattern)) {
        scores[category] += 1;
      }
    }
  }

  // Estimate context size needed
  const estimatedTokens = taskDescription.length * 1.3; // rough estimate
  if (estimatedTokens > 50000) {
    scores.longContext += 3;
  }

  // Detect urgency
  if (desc.includes('urgent') || desc.includes('asap') || desc.includes('quickly')) {
    scores.speed += 2;
  }

  return scores;
}

/**
 * Select optimal model based on task analysis
 */
function selectModel(taskDescription, options = {}) {
  const {
    preferProvider = null,
    maxCostTier = 'high',
    requireCategory = null,
    fallbackChain = true
  } = options;

  const taskScores = analyzeTask(taskDescription);
  
  // Determine primary requirement
  let primaryNeed = Object.keys(taskScores).reduce((a, b) => 
    taskScores[a] > taskScores[b] ? a : b
  );

  // If no clear winner, default to balanced
  if (taskScores[primaryNeed] === 0) {
    primaryNeed = 'balanced';
  }

  // Score each model
  const modelScores = {};
  for (const [modelName, modelInfo] of Object.entries(MODEL_REGISTRY)) {
    let score = 0;

    // Filter by cost tier
    const costTiers = { low: 1, medium: 2, high: 3 };
    if (costTiers[modelInfo.costTier] > costTiers[maxCostTier]) {
      continue;
    }

    // Filter by category if required
    if (requireCategory && modelInfo.category !== requireCategory) {
      continue;
    }

    // Filter by provider if preferred
    if (preferProvider && modelInfo.provider !== preferProvider) {
      score -= 10; // penalty, not elimination
    }

    // Calculate score based on task needs
    if (taskScores.reasoning > 0) {
      score += taskScores.reasoning * modelInfo.strength * 0.4;
    }
    if (taskScores.code > 0) {
      score += taskScores.code * modelInfo.code * 0.4;
    }
    if (taskScores.creative > 0) {
      score += taskScores.creative * modelInfo.creativity * 0.4;
    }
    if (taskScores.speed > 0) {
      score += taskScores.speed * modelInfo.speed * 0.3;
    }
    if (taskScores.longContext > 0) {
      score += taskScores.longContext * (modelInfo.contextWindow / 10000);
    }
    if (taskScores.balanced > 0) {
      score += taskScores.balanced * ((modelInfo.strength + modelInfo.speed) / 2) * 0.3;
    }

    // Category bonus
    if (primaryNeed === 'reasoning' && modelInfo.category === 'reasoning') score += 20;
    if (primaryNeed === 'code' && modelInfo.code > 85) score += 15;
    if (primaryNeed === 'creative' && modelInfo.category === 'creative') score += 20;
    if (primaryNeed === 'speed' && modelInfo.category === 'fast') score += 25;
    if (primaryNeed === 'longContext' && modelInfo.contextWindow > 150000) score += 30;

    modelScores[modelName] = score;
  }

  // Sort by score
  const sortedModels = Object.entries(modelScores)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name);

  if (sortedModels.length === 0) {
    throw new Error('No suitable models found with given constraints');
  }

  const selectedModel = sortedModels[0];
  const alternatives = fallbackChain ? sortedModels.slice(1, 4) : [];

  return {
    model: selectedModel,
    provider: MODEL_REGISTRY[selectedModel].provider,
    category: MODEL_REGISTRY[selectedModel].category,
    confidence: modelScores[selectedModel],
    reasoning: {
      primaryNeed,
      taskScores,
      alternativeModels: alternatives.map(m => ({
        model: m,
        provider: MODEL_REGISTRY[m].provider,
        score: modelScores[m]
      }))
    },
    modelInfo: MODEL_REGISTRY[selectedModel]
  };
}

/**
 * Get model information
 */
function getModelInfo(modelName) {
  return MODEL_REGISTRY[modelName] || null;
}

/**
 * List all models by category
 */
function listModels(category = null) {
  if (category) {
    return Object.entries(MODEL_REGISTRY)
      .filter(([, info]) => info.category === category)
      .map(([name, info]) => ({ name, ...info }));
  }
  return Object.entries(MODEL_REGISTRY)
    .map(([name, info]) => ({ name, ...info }));
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Model Selector - Intelligent model selection for task optimization

USAGE:
  node model-selector.js "task description" [options]
  node model-selector.js --list [category]
  node model-selector.js --info <model-name>

OPTIONS:
  --provider <name>       Prefer specific provider (OpenAI, Anthropic, Google)
  --max-cost <tier>       Maximum cost tier (low, medium, high)
  --category <cat>        Require specific category (reasoning, balanced, fast, creative)
  --json                  Output as JSON

EXAMPLES:
  node model-selector.js "solve complex mathematical proof"
  node model-selector.js "quick summary of this text" --max-cost low
  node model-selector.js "write creative story" --category creative
  node model-selector.js --list reasoning
  node model-selector.js --info claude-sonnet-4.5
`);
    process.exit(0);
  }

  // Handle --list
  if (args[0] === '--list') {
    const category = args[1] || null;
    const models = listModels(category);
    console.log('\n📋 Available Models:\n');
    models.forEach(m => {
      console.log(`  ${m.name} (${m.provider})`);
      console.log(`    Category: ${m.category} | Cost: ${m.costTier}`);
      console.log(`    Context: ${m.contextWindow.toLocaleString()} tokens`);
      console.log(`    Best for: ${m.bestFor.join(', ')}`);
      console.log('');
    });
    process.exit(0);
  }

  // Handle --info
  if (args[0] === '--info') {
    const modelName = args[1];
    const info = getModelInfo(modelName);
    if (!info) {
      console.error(`❌ Model '${modelName}' not found`);
      process.exit(1);
    }
    console.log(`\n📊 ${modelName} (${info.provider})\n`);
    console.log(`Category: ${info.category}`);
    console.log(`Cost Tier: ${info.costTier}`);
    console.log(`Context Window: ${info.contextWindow.toLocaleString()} tokens`);
    console.log(`\nScores:`);
    console.log(`  Strength: ${info.strength}/100`);
    console.log(`  Speed: ${info.speed}/100`);
    console.log(`  Creativity: ${info.creativity}/100`);
    console.log(`  Code: ${info.code}/100`);
    console.log(`\nBest for:`);
    info.bestFor.forEach(use => console.log(`  • ${use}`));
    console.log('');
    process.exit(0);
  }

  // Parse options
  const options = {};
  const jsonOutput = args.includes('--json');
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--provider') options.preferProvider = args[++i];
    if (args[i] === '--max-cost') options.maxCostTier = args[++i];
    if (args[i] === '--category') options.requireCategory = args[++i];
  }

  const taskDescription = args[0];
  
  try {
    const result = selectModel(taskDescription, options);
    
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n🎯 Selected Model: ${result.model}`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Confidence: ${Math.round(result.confidence)}`);
      console.log(`\n💡 Reasoning: Primary need detected as "${result.reasoning.primaryNeed}"`);
      console.log(`\n📋 Model Info:`);
      console.log(`   Context Window: ${result.modelInfo.contextWindow.toLocaleString()} tokens`);
      console.log(`   Cost Tier: ${result.modelInfo.costTier}`);
      console.log(`   Best for: ${result.modelInfo.bestFor.slice(0, 3).join(', ')}`);
      
      if (result.reasoning.alternativeModels.length > 0) {
        console.log(`\n🔄 Fallback Options:`);
        result.reasoning.alternativeModels.forEach((alt, i) => {
          console.log(`   ${i + 1}. ${alt.model} (${alt.provider}) - Score: ${Math.round(alt.score)}`);
        });
      }
      console.log('');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  selectModel,
  getModelInfo,
  listModels,
  MODEL_REGISTRY
};
