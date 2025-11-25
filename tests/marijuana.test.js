const {
    BASE_URL,
    MARIJUANA_TYPES,
    MARIJUANA_AMOUNTS,
    launchBrowser,
    clearStorage,
    generateMarijuanaMockData,
    addMarijuanaEntry,
    getEntryCount,
    calculateTotal,
    formatDateTimeLocal,
    getDateKey,
    sliceMockData,
} = require('./helpers/testUtils');

describe('Marijuana Form Tests', () => {
    let browser;
    let mockData;

    beforeAll(async () => {
	browser = await launchBrowser();
	mockData = generateMarijuanaMockData();
    });

    afterAll(async () => {
	if (browser) {
	    await browser.close();
	}
    });

    beforeEach(async () => {
	try {
	    await page.goto(BASE_URL)
	    await clearStorage(page);
	} catch (error) {
	    console.error('Error loading page:', error.message);
	    throw error;
	}
    });


    describe.skip('Add Marijuana Entries', () => {
	test('should add a single marijuana entry', async () => {
	    const entry = mockData[0];
	    
	    await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    
	    const count = await getEntryCount(page, '#mj-recent') 
	    expect(count).toBe(1);

	    // Verify entry appears in list
	    const entryText = await page.$eval('.entry-item', el => el.textContent);
	    expect(entryText).toContain(entry.type.toLowerCase());
	    expect(entryText).toContain(`${entry.amount} mg`);
	    
	});
	
	test('should add marijuana many entries and total should be correct', async () => {
	    let total = 0
	    
	    for (const entry of sliceMockData(mockData, 0, 15)) {
		total += entry.amount
		await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    }

	    const count = await getEntryCount(page, '#mj-recent');
	    expect(count).toBe(sliceMockData(mockData, 0, 15).length);
	    
	    // Verify we have entries from different days
	    const dailyTotals = calculateTotal(sliceMockData(mockData, 0, 15))
	    expect(dailyTotals).toBe(total)
	});

    });

    describe.skip('Update Marijuana Entries', () => {
	test('should update marijuana entry type', async () => {
	    const entry = mockData[0];
	    await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    
	    // Click first entry to edit
	    await page.click('#mj-recent .entry-item');
	    
	    // Change type
	    const newType = MARIJUANA_TYPES.find(t => t !== entry.type);
	    await page.select('#mj-type', newType);
	    
	    // Submit update
	    await page.click('#mj-submit-btn');
	    
	    // Verify update
	    const entryText = await page.$eval('#mj-recent .entry-item', el => el.textContent);

	    expect(entryText).toContain(newType);
	});

	test('should update marijuana entry amount', async () => {
	    const entry = mockData[0];
	    await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    
	    // Change amount
	    const newAmount = MARIJUANA_AMOUNTS.find(a => a !== entry.amount);
	    await page.select('#mj-amount', newAmount.toString());
	    
	    // Submit update
	    await page.click('#mj-submit-btn');
	    
	    // Verify update
	    const entryText = await page.$eval('#mj-recent .entry-item', el => el.textContent);
	    expect(entryText).toContain(`${newAmount} mg`);
	});

	test('should update marijuana entry datetime', async () => {
	    const entry = mockData[0];
	    await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    
	    // Click first entry to edit
	    await page.click('#mj-recent .entry-item');
	    	    
	    // Change datetime

	    const newDatetime = new Date();
	    newDatetime.setHours(12, 0, 0, 0);
	    const datetimeStr = formatDateTimeLocal(newDatetime);
	    await page.type('#mj-time', datetimeStr);
	    
	    // Submit update
	    await page.click('#mj-submit-btn');

	    const entryText = await page.$eval('#mj-recent .entry-item', el => el.textContent);
	    //12:00
	    expect(entryText).toContain(`${datetimeStr.substring(0,5)}`);
	});
    });

    describe('Delete Marijuana Entries', () => {
	test.only('should delete marijuana entry', async () => {
	    
	    
	    page.on('dialog', async dialog => {
		// Accept the confirmation dialog.
		await dialog.accept();
	    });

	    const entry = mockData[0];
	    await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    
	    // Click entry to edit, then delete
	    await page.click('#mj-recent .entry-item');
	    
	    // Look for delete button
	    const deleteButton = await page.$('.delete-btn');
	    if (deleteButton) {
		await deleteButton.click();

		debugger
		const result = await page.$eval('#mj-recent ', el => el);
		expect(result).toEqual({});
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
		
		const deleteButton = await page.$('#delete-marijuana');
		if (deleteButton) {
		    await deleteButton.click();
		}
	    }
	    
	    count = await getEntryCount(page, '#marijuana-list');
	    expect(count).toBe(0);
	});
    });

    describe.skip('Marijuana Chart Verification', () => {
	test('should display chart with correct daily totals', async () => {
	    // Add all mock data
	    for (const entry of mockData) {
		await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    }
	    
	    
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
	    
	    
	    // Add new entry for today
	    const newEntry = {
		type: MARIJUANA_TYPES[0],
		amount: 10,
		datetime: new Date()
	    };
	    
	    await addMarijuanaEntry(page, newEntry.type, newEntry.amount, newEntry.datetime);

	    
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
	    
	    // Delete first entry
	    await page.click('#marijuana-list li:first-child');
	    
	    const deleteButton = await page.$('#delete-marijuana');
	    if (deleteButton) {
		await deleteButton.click();
		
		// Verify count decreased
		const count = await getEntryCount(page, '#marijuana-list');
		expect(count).toBe(2);
	    }
	});
    });

})
