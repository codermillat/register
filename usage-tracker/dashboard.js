/**
 * Dashboard JavaScript - Interactive usage tracking dashboard
 */

let charts = {};
let currentData = null;

// Initialize dashboard
async function init() {
  await loadData();
  setupEventListeners();
  renderDashboard();
}

// Load usage data
async function loadData() {
  try {
    const response = await fetch('usage-data.json');
    const data = await response.json();
    currentData = data;
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    // Create mock data for demo
    currentData = { entries: [] };
    return currentData;
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('accountFilter').addEventListener('change', renderDashboard);
  document.getElementById('modelFilter').addEventListener('change', renderDashboard);
  document.getElementById('timeRange').addEventListener('change', renderDashboard);
}

// Refresh data
async function refreshData() {
  await loadData();
  renderDashboard();
}

// Get filtered entries
function getFilteredEntries() {
  if (!currentData || !currentData.entries) return [];

  let entries = currentData.entries;
  const accountFilter = document.getElementById('accountFilter').value;
  const modelFilter = document.getElementById('modelFilter').value;
  const timeRange = document.getElementById('timeRange').value;

  // Apply filters
  if (accountFilter) {
    entries = entries.filter(e => e.accountId === accountFilter);
  }

  if (modelFilter) {
    entries = entries.filter(e => e.model === modelFilter);
  }

  // Apply time range
  if (timeRange !== 'all') {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case '24h':
        cutoff.setHours(cutoff.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(cutoff.getDate() - 30);
        break;
    }

    entries = entries.filter(e => new Date(e.timestamp) >= cutoff);
  }

  return entries;
}

// Calculate statistics
function calculateStats(entries) {
  const stats = {
    totalRequests: entries.length,
    successfulRequests: entries.filter(e => e.success).length,
    failedRequests: entries.filter(e => !e.success).length,
    totalTokens: entries.reduce((sum, e) => sum + (e.tokensUsed || 0), 0),
    totalCredits: entries.reduce((sum, e) => sum + (e.creditsConsumed || 0), 0),
    byModel: {},
    byAccount: {},
    byTaskType: {},
    timeline: {}
  };

  // Group by model
  entries.forEach(e => {
    if (!stats.byModel[e.model]) {
      stats.byModel[e.model] = { requests: 0, tokens: 0, credits: 0 };
    }
    stats.byModel[e.model].requests++;
    stats.byModel[e.model].tokens += e.tokensUsed || 0;
    stats.byModel[e.model].credits += e.creditsConsumed || 0;
  });

  // Group by account
  entries.forEach(e => {
    if (!stats.byAccount[e.accountName]) {
      stats.byAccount[e.accountName] = { requests: 0, tokens: 0, credits: 0 };
    }
    stats.byAccount[e.accountName].requests++;
    stats.byAccount[e.accountName].tokens += e.tokensUsed || 0;
    stats.byAccount[e.accountName].credits += e.creditsConsumed || 0;
  });

  // Group by task type
  entries.forEach(e => {
    const taskType = e.taskType || 'unknown';
    if (!stats.byTaskType[taskType]) {
      stats.byTaskType[taskType] = { requests: 0, tokens: 0, credits: 0 };
    }
    stats.byTaskType[taskType].requests++;
    stats.byTaskType[taskType].tokens += e.tokensUsed || 0;
    stats.byTaskType[taskType].credits += e.creditsConsumed || 0;
  });

  // Create timeline
  entries.forEach(e => {
    const date = e.timestamp.split('T')[0];
    if (!stats.timeline[date]) {
      stats.timeline[date] = { requests: 0, tokens: 0, credits: 0 };
    }
    stats.timeline[date].requests++;
    stats.timeline[date].tokens += e.tokensUsed || 0;
    stats.timeline[date].credits += e.creditsConsumed || 0;
  });

  return stats;
}

// Render dashboard
function renderDashboard() {
  const entries = getFilteredEntries();
  const stats = calculateStats(entries);

  // Update summary cards
  document.getElementById('totalRequests').textContent = stats.totalRequests.toLocaleString();
  document.getElementById('successRate').textContent = 
    `${((stats.successfulRequests / stats.totalRequests) * 100 || 0).toFixed(1)}% success rate`;
  document.getElementById('totalTokens').textContent = stats.totalTokens.toLocaleString();
  document.getElementById('totalCredits').textContent = stats.totalCredits.toFixed(2);
  document.getElementById('activeAccounts').textContent = Object.keys(stats.byAccount).length;

  // Update filter dropdowns
  updateFilters();

  // Render charts
  renderTimelineChart(stats.timeline);
  renderModelChart(stats.byModel);
  renderAccountChart(stats.byAccount);
  renderTaskTypeChart(stats.byTaskType);

  // Render table
  renderTable(entries);

  // Check for warnings
  checkWarnings(stats);
}

// Update filter dropdowns
function updateFilters() {
  const entries = currentData.entries || [];
  
  // Update account filter
  const accounts = [...new Set(entries.map(e => e.accountId))];
  const accountFilter = document.getElementById('accountFilter');
  const currentAccount = accountFilter.value;
  accountFilter.innerHTML = '<option value="">All Accounts</option>';
  accounts.forEach(acc => {
    const entry = entries.find(e => e.accountId === acc);
    const option = document.createElement('option');
    option.value = acc;
    option.textContent = entry.accountName;
    accountFilter.appendChild(option);
  });
  accountFilter.value = currentAccount;

  // Update model filter
  const models = [...new Set(entries.map(e => e.model))];
  const modelFilter = document.getElementById('modelFilter');
  const currentModel = modelFilter.value;
  modelFilter.innerHTML = '<option value="">All Models</option>';
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    modelFilter.appendChild(option);
  });
  modelFilter.value = currentModel;
}

// Render timeline chart
function renderTimelineChart(timeline) {
  const ctx = document.getElementById('timelineChart');
  
  const dates = Object.keys(timeline).sort();
  const requests = dates.map(d => timeline[d].requests);
  const credits = dates.map(d => timeline[d].credits);

  if (charts.timeline) {
    charts.timeline.destroy();
  }

  charts.timeline = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Requests',
          data: requests,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          yAxisID: 'y'
        },
        {
          label: 'Credits',
          data: credits,
          borderColor: '#f56565',
          backgroundColor: 'rgba(245, 101, 101, 0.1)',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Requests' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Credits' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// Render model distribution chart
function renderModelChart(byModel) {
  const ctx = document.getElementById('modelChart');
  
  const models = Object.keys(byModel);
  const requests = models.map(m => byModel[m].requests);

  const colors = [
    '#667eea', '#f56565', '#48bb78', '#ed8936', '#9f7aea',
    '#38b2ac', '#ecc94b', '#ed64a6', '#4299e1', '#a0aec0'
  ];

  if (charts.model) {
    charts.model.destroy();
  }

  charts.model = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: models,
      datasets: [{
        data: requests,
        backgroundColor: colors.slice(0, models.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

// Render account chart
function renderAccountChart(byAccount) {
  const ctx = document.getElementById('accountChart');
  
  const accounts = Object.keys(byAccount);
  const credits = accounts.map(a => byAccount[a].credits);

  if (charts.account) {
    charts.account.destroy();
  }

  charts.account = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: accounts,
      datasets: [{
        label: 'Credits Consumed',
        data: credits,
        backgroundColor: '#667eea'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Credits' }
        }
      }
    }
  });
}

// Render task type chart
function renderTaskTypeChart(byTaskType) {
  const ctx = document.getElementById('taskTypeChart');
  
  const taskTypes = Object.keys(byTaskType);
  const requests = taskTypes.map(t => byTaskType[t].requests);

  const colors = [
    '#48bb78', '#667eea', '#ed8936', '#9f7aea', '#38b2ac',
    '#ecc94b', '#ed64a6', '#4299e1', '#f56565', '#a0aec0'
  ];

  if (charts.taskType) {
    charts.taskType.destroy();
  }

  charts.taskType = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: taskTypes,
      datasets: [{
        data: requests,
        backgroundColor: colors.slice(0, taskTypes.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

// Render recent entries table
function renderTable(entries) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No entries found</td></tr>';
    return;
  }

  // Sort by timestamp descending
  const sorted = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Show last 50 entries
  sorted.slice(0, 50).forEach(entry => {
    const row = document.createElement('tr');
    
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const status = entry.success ? 
      '<span class="success">✓ Success</span>' : 
      '<span class="failure">✗ Failed</span>';

    row.innerHTML = `
      <td>${timestamp}</td>
      <td>${entry.accountName}</td>
      <td>${entry.model}</td>
      <td>${entry.taskType}</td>
      <td>${(entry.tokensUsed || 0).toLocaleString()}</td>
      <td>${(entry.creditsConsumed || 0).toFixed(2)}</td>
      <td>${status}</td>
    `;

    tbody.appendChild(row);
  });
}

// Check for warnings
function checkWarnings(stats) {
  const warningsDiv = document.getElementById('warnings');
  warningsDiv.innerHTML = '';

  // Check failure rate
  const failureRate = (stats.failedRequests / stats.totalRequests) * 100;
  if (failureRate > 10) {
    warningsDiv.innerHTML += `
      <div class="warning">
        <h3>⚠️ High Failure Rate</h3>
        <p>${failureRate.toFixed(1)}% of requests are failing. Check rate limits and account status.</p>
      </div>
    `;
  }

  // Check credit consumption
  if (stats.totalCredits > 1000) {
    warningsDiv.innerHTML += `
      <div class="warning">
        <h3>💰 High Credit Usage</h3>
        <p>${stats.totalCredits.toFixed(0)} credits consumed. Consider using lower-cost models for simple tasks.</p>
      </div>
    `;
  }
}

// Export functions
function exportCSV() {
  const entries = getFilteredEntries();
  const headers = 'Timestamp,Account,Model,Task Type,Tokens,Credits,Success\n';
  const rows = entries.map(e => 
    `${e.timestamp},${e.accountName},${e.model},${e.taskType},${e.tokensUsed},${e.creditsConsumed},${e.success}`
  ).join('\n');
  
  downloadFile('usage-export.csv', headers + rows);
}

function exportJSON() {
  const entries = getFilteredEntries();
  const stats = calculateStats(entries);
  const data = { stats, entries };
  
  downloadFile('usage-export.json', JSON.stringify(data, null, 2));
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
