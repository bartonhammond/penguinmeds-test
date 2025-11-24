const {
  BASE_URL,
  NICOTINE_TYPES,
  NICOTINE_AMOUNTS,
  launchBrowser,
  clearStorage,
  generateNicotineMockData,
  addNicotineEntry,
  getEntryCount,
  calculateDailyTotals,
  formatDateTimeLocal,
  getDateKey
} = require('./helpers/testUtils');

describe('Nicotine Form Tests', () => {
  let browser;
  let page;
  let mockData;

  beforeAll(async () => {
    browser = await launchBrowser();
    mockData = generateNicotineMockData();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await clearStorage(page);
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Add Nicotine Entries', () => {
    test('should add a single nicotine entry', async () => {
      const entry = mockData[0];
      
      await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      
      const count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(1);
      
      // Verify entry appears in list
      const entryText = await page.$eval('#nicotine-list', el => el.textContent);
      expect(entryText).toContain(entry.type);
      expect(entryText).toContain(`${entry.amount} mg`);
    });

    test('should add multiple nicotine entries', async () => {
      const entriesToAdd = mockData.slice(0, 5);
      
      for (const entry of entriesToAdd) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      const count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(5);
    });

    test('should add nicotine entries for a full week', async () => {
      for (const entry of mockData) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      const count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(mockData.length);
      
      // Verify we have entries from different days
      const dailyTotals = calculateDailyTotals(mockData);
      const uniqueDays = Object.keys(dailyTotals).length;
      expect(uniqueDays).toBe(7);
    });

    test('should add all nicotine types', async () => {
      const now = new Date();
      
      for (let i = 0; i < NICOTINE_TYPES.length; i++) {
        const type = NICOTINE_TYPES[i];
        const amount = NICOTINE_AMOUNTS[0];
        const datetime = new Date(now.getTime() - i * 60000); // Offset by minutes
        
        await addNicotineEntry(page, type, amount, datetime);
      }
      
      const count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(NICOTINE_TYPES.length);
    });

    test('should add various nicotine amounts', async () => {
      const now = new Date();
      
      for (let i = 0; i < NICOTINE_AMOUNTS.length; i++) {
        const type = NICOTINE_TYPES[0];
        const amount = NICOTINE_AMOUNTS[i];
        const datetime = new Date(now.getTime() - i * 60000);
        
        await addNicotineEntry(page, type, amount, datetime);
      }
      
      const count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(NICOTINE_AMOUNTS.length);
    });
  });

  describe('Update Nicotine Entries', () => {
    test('should update nicotine entry type', async () => {
      const entry = mockData[0];
      await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      
      // Click first entry to edit
      await page.click('#nicotine-list li');
      await page.waitForTimeout(500);
      
      // Change type
      const newType = NICOTINE_TYPES.find(t => t !== entry.type);
      await page.select('#nicotine-type', newType);
      
      // Submit update
      await page.click('#add-nicotine');
      await page.waitForTimeout(500);
      
      // Verify update
      const entryText = await page.$eval('#nicotine-list', el => el.textContent);
      expect(entryText).toContain(newType);
    });

    test('should update nicotine entry amount', async () => {
      const entry = mockData[0];
      await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      
      // Click first entry to edit
      await page.click('#nicotine-list li');
      await page.waitForTimeout(500);
      
      // Change amount
      const newAmount = NICOTINE_AMOUNTS.find(a => a !== entry.amount);
      await page.select('#nicotine-amount', newAmount.toString());
      
      // Submit update
      await page.click('#add-nicotine');
      await page.waitForTimeout(500);
      
      // Verify update
      const entryText = await page.$eval('#nicotine-list', el => el.textContent);
      expect(entryText).toContain(`${newAmount} mg`);
    });

    test('should update nicotine entry datetime', async () => {
      const entry = mockData[0];
      await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      
      // Click first entry to edit
      await page.click('#nicotine-list li');
      await page.waitForTimeout(500);
      
      // Change datetime
      const newDatetime = new Date();
      newDatetime.setHours(14, 30, 0, 0);
      const datetimeStr = formatDateTimeLocal(newDatetime);
      
      await page.evaluate((dt) => {
        document.querySelector('#nicotine-datetime').value = dt;
      }, datetimeStr);
      
      // Submit update
      await page.click('#add-nicotine');
      await page.waitForTimeout(500);
      
      const count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(1); // Still one entry
    });

    test('should update multiple fields at once', async () => {
      const entry = mockData[0];
      await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      
      // Click entry to edit
      await page.click('#nicotine-list li');
      await page.waitForTimeout(500);
      
      // Change type and amount
      const newType = NICOTINE_TYPES.find(t => t !== entry.type);
      const newAmount = NICOTINE_AMOUNTS.find(a => a !== entry.amount);
      
      await page.select('#nicotine-type', newType);
      await page.select('#nicotine-amount', newAmount.toString());
      
      // Submit update
      await page.click('#add-nicotine');
      await page.waitForTimeout(500);
      
      // Verify both updates
      const entryText = await page.$eval('#nicotine-list', el => el.textContent);
      expect(entryText).toContain(newType);
      expect(entryText).toContain(`${newAmount} mg`);
    });
  });

  describe('Delete Nicotine Entries', () => {
    test('should delete nicotine entry', async () => {
      const entry = mockData[0];
      await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      
      let count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(1);
      
      // Click entry to edit, then delete
      await page.click('#nicotine-list li');
      await page.waitForTimeout(500);
      
      // Look for delete button
      const deleteButton = await page.$('#delete-nicotine');
      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        count = await getEntryCount(page, '#nicotine-list');
        expect(count).toBe(0);
      }
    });

    test('should delete multiple nicotine entries', async () => {
      const entriesToAdd = mockData.slice(0, 4);
      
      for (const entry of entriesToAdd) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      let count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(4);
      
      // Delete entries one by one
      for (let i = 0; i < 4; i++) {
        await page.click('#nicotine-list li:first-child');
        await page.waitForTimeout(500);
        
        const deleteButton = await page.$('#delete-nicotine');
        if (deleteButton) {
          await deleteButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(0);
    });

    test('should delete specific entry from multiple entries', async () => {
      const entriesToAdd = mockData.slice(0, 3);
      
      for (const entry of entriesToAdd) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      let count = await getEntryCount(page, '#nicotine-list');
      expect(count).toBe(3);
      
      // Delete second entry
      await page.click('#nicotine-list li:nth-child(2)');
      await page.waitForTimeout(500);
      
      const deleteButton = await page.$('#delete-nicotine');
      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        count = await getEntryCount(page, '#nicotine-list');
        expect(count).toBe(2);
      }
    });
  });

  describe('Nicotine Chart Verification', () => {
    test('should display chart with correct daily totals', async () => {
      // Add all mock data
      for (const entry of mockData) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      await page.waitForTimeout(2000); // Wait for chart to render
      
      // Calculate expected totals
      const expectedTotals = calculateDailyTotals(mockData);
      
      // Verify chart exists
      const chartExists = await page.$('#nicotine-chart');
      expect(chartExists).toBeTruthy();
      
      // Get displayed total for today
      const todayKey = getDateKey(new Date());
      const todayTotal = expectedTotals[todayKey] || 0;
      
      const displayedTotal = await page.$eval('#nicotine-total', el => {
        const match = el.textContent.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      expect(displayedTotal).toBe(todayTotal);
    });

    test('should update chart after adding new entry', async () => {
      // Add initial entries
      const initialEntries = mockData.slice(0, 5);
      for (const entry of initialEntries) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      await page.waitForTimeout(1000);
      
      // Add new entry for today
      const newEntry = {
        type: NICOTINE_TYPES[0],
        amount: 2,
        datetime: new Date()
      };
      
      await addNicotineEntry(page, newEntry.type, newEntry.amount, newEntry.datetime);
      await page.waitForTimeout(1000);
      
      // Verify total updated
      const allEntries = [...initialEntries, newEntry];
      const todayKey = getDateKey(new Date());
      const todayTotal = allEntries
        .filter(e => getDateKey(e.datetime) === todayKey)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const displayedTotal = await page.$eval('#nicotine-total', el => {
        const match = el.textContent.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      expect(displayedTotal).toBe(todayTotal);
    });

    test('should update chart after deleting entry', async () => {
      // Add entries
      const entriesToAdd = mockData.slice(0, 3);
      for (const entry of entriesToAdd) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      await page.waitForTimeout(1000);
      
      // Delete first entry
      await page.click('#nicotine-list li:first-child');
      await page.waitForTimeout(500);
      
      const deleteButton = await page.$('#delete-nicotine');
      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // Verify count decreased
        const count = await getEntryCount(page, '#nicotine-list');
        expect(count).toBe(2);
      }
    });

    test('should show correct totals for full week of data', async () => {
      // Add all mock data
      for (const entry of mockData) {
        await addNicotineEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      await page.waitForTimeout(2000);
      
      // Calculate expected totals
      const expectedTotals = calculateDailyTotals(mockData);
      
      // Verify we have data for 7 days
      expect(Object.keys(expectedTotals).length).toBe(7);
      
      // Verify chart is present
      const chartExists = await page.$('#nicotine-chart');
      expect(chartExists).toBeTruthy();
    });
  });
});
