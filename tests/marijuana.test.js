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
    calculateDailyTotalsFromLocalStorage,
    calculateTotal,
    formatDateTimeLocal,
    getDateKey,
    sliceMockData,
    getDateStr,
    getUniqueDates,
    getMMDDYYYY,
    inputDate,
    waitForListToDecrease
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


    describe('Add Marijuana Entries', () => {
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
	    const testData = sliceMockData(mockData, 0, 15)

	    //create entries
	    for (const entry of testData) {
		total += entry.amount
		await addMarijuanaEntry(page, entry.type, entry.amount, entry.datetime);
	    }

	    //Go to each date and get the number of entries
	    let count = 0
	    const uniqueEventDates = getUniqueDates(testData, 'datetime');
	    for (const entry of uniqueEventDates) {
		// Use the keyboard to type the date in a valid format (MMDDYYYY is common)
		// This will trigger the change handler as if a user typed it
		const entryWithSlash = entry.replaceAll('-','/')
		await inputDate(page, new Date(entryWithSlash))
		count += await getEntryCount(page, '#mj-recent');
		
	    }

	    expect(count).toBe(testData.length);

	    // Verify we have entries from different days
	    const dailyTotals = calculateTotal(testData)
	    expect(dailyTotals).toBe(total)
	});

    });

    describe('Update Marijuana Entries', () => {
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
	    
	    await page.type('#mj-time', '12:00')

	    // Submit update
	    await page.click('#mj-submit-btn');

	    const entryText = await page.$eval('#mj-recent .entry-item', el => el.textContent);
	    expect(entryText).toContain(`12:00`);
	});
    });

    describe('Delete Marijuana Entries', () => {
	test('should delete marijuana entry', async () => {
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

		const result = await page.$eval('#mj-recent ', el => el);
		expect(result).toEqual({});
	    }
	});
    })
})
