const puppeteer = require('puppeteer');

const BASE_URL = 'https://bartonhammond.github.io/penquinmeds/';

// Marijuana types and amounts
const MARIJUANA_TYPES = ['Flower', 'Tincture', 'Day Gummy', 'Night Gummy', 'Oil'];
const MARIJUANA_AMOUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

// Nicotine types and amounts
const NICOTINE_TYPES = ['Gum', 'Lozenge', 'Pouch'];
const NICOTINE_AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Launch browser instance
 */
async function launchBrowser() {
  const headless = process.env.HEADLESS !== 'false';
  return await puppeteer.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: headless ? 0 : 50
  });
}

/**
 * Clear all local storage data
 */
async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });
}

/**
 * Generate random date within the last 7 days
 */
function getRandomDateInLastWeek(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Format date for input field (YYYY-MM-DDTHH:mm)
 */
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get date key for grouping (YYYY-MM-DD)
 */
function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate mock marijuana entries for a full week
 */
function generateMarijuanaMockData() {
  const entries = [];
  
  for (let day = 0; day < 7; day++) {
    const entriesPerDay = Math.floor(Math.random() * 3) + 2; // 2-4 entries per day
    
    for (let i = 0; i < entriesPerDay; i++) {
      const date = getRandomDateInLastWeek(day);
      date.setHours(8 + Math.floor(Math.random() * 12)); // Random hour between 8am-8pm
      date.setMinutes(Math.floor(Math.random() * 60));
      
      entries.push({
        type: MARIJUANA_TYPES[Math.floor(Math.random() * MARIJUANA_TYPES.length)],
        amount: MARIJUANA_AMOUNTS[Math.floor(Math.random() * MARIJUANA_AMOUNTS.length)],
        datetime: date
      });
    }
  }
  
  return entries.sort((a, b) => b.datetime - a.datetime);
}

/**
 * Generate mock nicotine entries for a full week
 */
function generateNicotineMockData() {
  const entries = [];
  
  for (let day = 0; day < 7; day++) {
    const entriesPerDay = Math.floor(Math.random() * 4) + 3; // 3-6 entries per day
    
    for (let i = 0; i < entriesPerDay; i++) {
      const date = getRandomDateInLastWeek(day);
      date.setHours(7 + Math.floor(Math.random() * 14)); // Random hour between 7am-9pm
      date.setMinutes(Math.floor(Math.random() * 60));
      
      entries.push({
        type: NICOTINE_TYPES[Math.floor(Math.random() * NICOTINE_TYPES.length)],
        amount: NICOTINE_AMOUNTS[Math.floor(Math.random() * NICOTINE_AMOUNTS.length)],
        datetime: date
      });
    }
  }
  
  return entries.sort((a, b) => b.datetime - a.datetime);
}

/**
 * Add marijuana entry via form
 */
async function addMarijuanaEntry(page, type, amount, datetime) {
  // Select marijuana type
  await page.select('#marijuana-type', type);
  
  // Select marijuana amount
  await page.select('#marijuana-amount', amount.toString());
  
  // Set datetime
  const datetimeStr = formatDateTimeLocal(datetime);
  await page.evaluate((dt) => {
    document.querySelector('#marijuana-datetime').value = dt;
  }, datetimeStr);
  
  // Submit form
  await page.click('#add-marijuana');
  await page.waitForTimeout(500); // Wait for entry to be added
}

/**
 * Add nicotine entry via form
 */
async function addNicotineEntry(page, type, amount, datetime) {
  // Select nicotine type
  await page.select('#nicotine-type', type);
  
  // Select nicotine amount
  await page.select('#nicotine-amount', amount.toString());
  
  // Set datetime
  const datetimeStr = formatDateTimeLocal(datetime);
  await page.evaluate((dt) => {
    document.querySelector('#nicotine-datetime').value = dt;
  }, datetimeStr);
  
  // Submit form
  await page.click('#add-nicotine');
  await page.waitForTimeout(500); // Wait for entry to be added
}

/**
 * Get total entries count
 */
async function getEntryCount(page, selector) {
  return await page.evaluate((sel) => {
    const list = document.querySelector(sel);
    return list ? list.children.length : 0;
  }, selector);
}

/**
 * Calculate expected daily totals from entries
 */
function calculateDailyTotals(entries) {
  const totals = {};
  
  entries.forEach(entry => {
    const dateKey = getDateKey(entry.datetime);
    if (!totals[dateKey]) {
      totals[dateKey] = 0;
    }
    totals[dateKey] += entry.amount;
  });
  
  return totals;
}

/**
 * Wait for chart to render
 */
async function waitForChart(page, chartSelector) {
  await page.waitForSelector(chartSelector, { timeout: 5000 });
  await page.waitForTimeout(1000); // Additional wait for chart animation
}

/**
 * Get chart data points
 */
async function getChartData(page, canvasSelector) {
  return await page.evaluate((selector) => {
    const canvas = document.querySelector(selector);
    if (!canvas) return null;
    
    // Try to access chart instance from canvas
    const chartInstance = canvas.chart || canvas.__chartjs__;
    if (!chartInstance) return null;
    
    const data = chartInstance.data.datasets[0].data;
    const labels = chartInstance.data.labels;
    
    return { data, labels };
  }, canvasSelector);
}

module.exports = {
  BASE_URL,
  MARIJUANA_TYPES,
  MARIJUANA_AMOUNTS,
  NICOTINE_TYPES,
  NICOTINE_AMOUNTS,
  launchBrowser,
  clearStorage,
  getRandomDateInLastWeek,
  formatDateTimeLocal,
  getDateKey,
  generateMarijuanaMockData,
  generateNicotineMockData,
  addMarijuanaEntry,
  addNicotineEntry,
  getEntryCount,
  calculateDailyTotals,
  waitForChart,
  getChartData
};
