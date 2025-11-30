const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:8000/'

// Marijuana types and amounts
const MARIJUANA_TYPES = ['flower', 'tincture', 'day gummy', 'night gummy', 'oil'];
const MARIJUANA_AMOUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

// Nicotine types and amounts
const NICOTINE_TYPES = ['gum', 'lozenge', 'pouch'];
const NICOTINE_AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Local storage key name

/**
 * Launch browser instance
 */
async function launchBrowser() {
    const headless = process.env.HEADLESS !== 'false';
    return await puppeteer.launch({
	headless: headless ? 'new' : false,
	slowMo: headless ? 0 : 50,
	timeout: 30000
    });
}

/**
 * Clear all local storage data
 */
async function clearStorage(page) {
    await page.evaluate(() => localStorage.clear())
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
    return date.toLocaleString('en-US', {
	hour: '2-digit',
	minute: '2-digit'
    })
}
// Get date string
function getDateStr(date = new Date()) {
    return date.toISOString().split('T')[0];
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
async function inputDate(page, datetime) {
    await page.locator('#mj-date').fill('')
    await page.locator('#mj-date').fill(getMMDDYYYY(datetime))
}
/**
 * Add marijuana entry via form
 */
async function addMarijuanaEntry(page, type, amount, datetime) {
    await inputDate(page, datetime)
    
    // Select marijuana type
    await page.select('#mj-type', type);
    
    // Select marijuana amount
    await page.select('#mj-amount', amount.toString());
    
    // Set datetime
    const datetimeStr = formatDateTimeLocal(datetime);
    await page.type('#mj-time', datetimeStr); 
    
    // Submit form
    await page.click('#mj-submit-btn');
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
}

/**
 * Get total entries count - these entries contain a element with a description which is then ignored
 */
async function getEntryCount(page, selector) {
    return await page.evaluate((sel) => {
	const list = document.querySelector(sel);
	const count = list ? list.children.length -1 : 0;
	return count
    }, selector);
}
/**
   calculate daily
*/
function calculateDailyTotals(entries) {
    let totals = {}
    
    entries.forEach(entry => {
	let dt = new Date(entry.datetime)
	if (totals.hasOwnProperty(dt.getDate())) {
	    totals[dt.getDate()] += entry.amount
	} else {
	    totals[dt.getDate()] = entry.amount
	}
    });
    return totals
		    
}
function calculateDailyTotalsFromLocalStorage() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('entries:'));
    let totals = {}
    keys.forEach(key => {

        const date = key.replace('entries:', '');
    });    
}
/**

 * Calculate expected daily totals from entries
 */
function calculateTotal(entries) {
    let total = 0
    
    entries.forEach(entry => {
	total += entry.amount;
    });
    
    return total
}

/**
 * Wait for chart to render
 */
async function waitForChart(page, chartSelector) {
    await page.waitForSelector(chartSelector, { timeout: 5000 });
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
/**
   Return slice of array
**/
function sliceMockData(mock, start, end) {
    return mock.slice(start,end)
}

/**
 * Get date for html input
 */
function getMMDDYYYY(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
   get the unique dates
**/

function getUniqueDates(dataArray, dateKey) {
    const uniqueDates = new Set();

  dataArray.forEach(item => {
      const date = new Date(item[dateKey])
      uniqueDates.add(getMMDDYYYY(date))
  });
  return Array.from(uniqueDates); // Convert the Set back to an array
}
/**
   The results should decrease
**/
async function waitForListToDecrease(count, callback) {
    debugger
    const interval = setInterval(async () => {
	const result = await page.$eval('#mj-recent ', el => el);
	debugger
	clearInterval(interval);
	callback();
    }, 100)
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
    calculateDailyTotalsFromLocalStorage,
    calculateTotal,
    waitForChart,
    getChartData,
    sliceMockData,
    getDateStr,
    getUniqueDates,
    getMMDDYYYY,
    inputDate,
    waitForListToDecrease
};
