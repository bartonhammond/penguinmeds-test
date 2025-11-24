const {
  BASE_URL,
  MARIJUANA_TYPES,
  MARIJUANA_AMOUNTS,
  launchBrowser,
  clearStorage,
  generateMarijuanaMockData,
  addMarijuanaEntry,
  getEntryCount,
  calculateDailyTotals,
  formatDateTimeLocal,
  getDateKey
} = require('./helpers/testUtils');

describe('Marijuana Form Tests', () => {
  let browser;
  let page;
  let mockData;

  beforeAll(async () => {
    browser = await launchBrowser();
    mockData = generateMarijuanaMockData();
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

  describe('Add Marijuana Entries', () => {
    test('should add a single marijuana entry', async () => {
      const entry = mockData[0];
      
      await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      
      const count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(1);
      
      // Verify entry appears in list
      const entryText = await page.$eval('#marijuana-list', el => el.textContent);
      expect(entryText).toContain(entry.type);
      expect(entryText).toContain(`${entry.amount} mg`);
    });

    test('should add multiple marijuana entries', async () => {
      const entriesToAdd = mockData.slice(0, 5);
      
      for (const entry of entriesToAdd) {
        await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      const count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(5);
    });

    test('should add marijuana entries for a full week', async () => {
      for (const entry of mockData) {
        await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      const count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(mockData.length);
      
      // Verify we have entries from different days
      const dailyTotals = calculateDailyTotals(mockData);
      const uniqueDays = Object.keys(dailyTotals).length;
      expect(uniqueDays).toBe(7);
    });

    test('should add all marijuana types', async () => {
      const now = new Date();
      
      for (let i = 0; i < MARIJUANA_TYPES.length; i++) {
        const type = MARIJUANA_TYPES[i];
        const amount = MARIJUANA_AMOUNTS[0];
        const datetime = new Date(now.getTime() - i * 60000); // Offset by minutes
        
        await addMarijuanaEntry(page, type, amount, datetime);
      }
      
      const count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(MARIJUANA_TYPES.length);
    });
  });

  describe('Update Marijuana Entries', () => {
    test('should update marijuana entry type', async () => {
      const entry = mockData[0];
      await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      
      // Click first entry to edit
      await page.click('#marijuana-list li');
      await page.waitForTimeout(500);
      
      // Change type
      const newType = MARIJUANA_TYPES.find(t => t !== entry.type);
      await page.select('#marijuana-type', newType);
      
      // Submit update
      await page.click('#add-marijuana');
      await page.waitForTimeout(500);
      
      // Verify update
      const entryText = await page.$eval('#marijuana-list', el => el.textContent);
      expect(entryText).toContain(newType);
    });

    test('should update marijuana entry amount', async () => {
      const entry = mockData[0];
      await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      
      // Click first entry to edit
      await page.click('#marijuana-list li');
      await page.waitForTimeout(500);
      
      // Change amount
      const newAmount = MARIJUANA_AMOUNTS.find(a => a !== entry.amount);
      await page.select('#marijuana-amount', newAmount.toString());
      
      // Submit update
      await page.click('#add-marijuana');
      await page.waitForTimeout(500);
      
      // Verify update
      const entryText = await page.$eval('#marijuana-list', el => el.textContent);
      expect(entryText).toContain(`${newAmount} mg`);
    });

    test('should update marijuana entry datetime', async () => {
      const entry = mockData[0];
      await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      
      // Click first entry to edit
      await page.click('#marijuana-list li');
      await page.waitForTimeout(500);
      
      // Change datetime
      const newDatetime = new Date();
      newDatetime.setHours(12, 0, 0, 0);
      const datetimeStr = formatDateTimeLocal(newDatetime);
      
      await page.evaluate((dt) => {
        document.querySelector('#marijuana-datetime').value = dt;
      }, datetimeStr);
      
      // Submit update
      await page.click('#add-marijuana');
      await page.waitForTimeout(500);
      
      const count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(1); // Still one entry
    });
  });

  describe('Delete Marijuana Entries', () => {
    test('should delete marijuana entry', async () => {
      const entry = mockData[0];
      await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      
      let count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(1);
      
      // Click entry to edit, then delete
      await page.click('#marijuana-list li');
      await page.waitForTimeout(500);
      
      // Look for delete button
      const deleteButton = await page.$('#delete-marijuana');
      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        count = await getEntryCount(page, '#marijuana-list');
        expect(count).toBe(0);
      }
    });

    test('should delete multiple marijuana entries', async () => {
      const entriesToAdd = mockData.slice(0, 3);
      
      for (const entry of entriesToAdd) {
        await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      let count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(3);
      
      // Delete entries one by one
      for (let i = 0; i < 3; i++) {
        await page.click('#marijuana-list li:first-child');
        await page.waitForTimeout(500);
        
        const deleteButton = await page.$('#delete-marijuana');
        if (deleteButton) {
          await deleteButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      count = await getEntryCount(page, '#marijuana-list');
      expect(count).toBe(0);
    });
  });

  describe('Marijuana Chart Verification', () => {
    test('should display chart with correct daily totals', async () => {
      // Add all mock data
      for (const entry of mockData) {
        await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      await page.waitForTimeout(2000); // Wait for chart to render
      
      // Calculate expected totals
      const expectedTotals = calculateDailyTotals(mockData);
      
      // Verify chart exists
      const chartExists = await page.$('#marijuana-chart');
      expect(chartExists).toBeTruthy();
      
      // Get displayed total for today
      const todayKey = getDateKey(new Date());
      const todayTotal = expectedTotals[todayKey] || 0;
      
      const displayedTotal = await page.$eval('#marijuana-total', el => {
        const match = el.textContent.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      expect(displayedTotal).toBe(todayTotal);
    });

    test('should update chart after adding new entry', async () => {
      // Add initial entries
      const initialEntries = mockData.slice(0, 5);
      for (const entry of initialEntries) {
        await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      await page.waitForTimeout(1000);
      
      // Add new entry for today
      const newEntry = {
        type: MARIJUANA_TYPES[0],
        amount: 10,
        datetime: new Date()
      };
      
      await addMarijuanaEntry(page, newEntry.type, newEntry.amount, newEntry.datetime);
      await page.waitForTimeout(1000);
      
      // Verify total updated
      const allEntries = [...initialEntries, newEntry];
      const todayKey = getDateKey(new Date());
      const todayTotal = allEntries
        .filter(e => getDateKey(e.datetime) === todayKey)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const displayedTotal = await page.$eval('#marijuana-total', el => {
        const match = el.textContent.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      expect(displayedTotal).toBe(todayTotal);
    });

    test('should update chart after deleting entry', async () => {
      // Add entries
      const entriesToAdd = mockData.slice(0, 3);
      for (const entry of entriesToAdd) {
        await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
      }
      
      await page.waitForTimeout(1000);
      
      // Delete first entry
      await page.click('#marijuana-list li:first-child');
      await page.waitForTimeout(500);
      
      const deleteButton = await page.$('#delete-marijuana');
      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // Verify count decreased
        const count = await getEntryCount(page, '#marijuana-list');
        expect(count).toBe(2);
      }
    });
  });
});
