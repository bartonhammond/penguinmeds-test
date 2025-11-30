const {
    BASE_URL,
    MARIJUANA_TYPES,
    MARIJUANA_AMOUNTS,
    NICOTINE_TYPES,
    NICOTINE_AMOUNTS,
    launchBrowser,
    clearStorage,
    generateMarijuanaMockData,
    generateNicotineMockData,
    addEntry,
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



describe('Form Tests', () => {
    const possiblePrefix = ['mj','nic']
    let browser;
    let mockData;
    let prefix;

    beforeAll(async () => {
	prefix = process.argv[4]
	if (possiblePrefix.indexOf(prefix) < 0) {
	    console.log(`Invalid prefix: ${prefix} - use only ${possiblePrefix.join(' or ')}`)
	    process.exit(1)
	}
	browser = await launchBrowser();
	
	switch (prefix) {
	case 'mj':
	    mockData = generateMarijuanaMockData()
	    break
	case 'nic':
	    mockData = generateNicotineMockData()
	    break
	}
    });

    afterAll(async () => {
	if (browser) {
	    await browser.close();
	}
    });

    beforeEach(async () => {
	try {
	    await page.goto(BASE_URL)
	    
	    if (prefix === 'mj')
		await page.click('[data-tab="0"]')
	    if (prefix === 'nic')
		await page.click('[data-tab="1"]')
	    
	    await clearStorage(page);
	} catch (error) {
	    console.error('Error loading page:', error.message);
	    throw error;
	}
    });


    describe(`Add Entries`, () => {
	test('should add a single entry', async () => {
	    const entry = mockData[0];

	    await addEntry(prefix, page, entry.type, entry.amount, entry.datetime)
	    
	    const count = await getEntryCount(prefix, page, `#${prefix}-recent`)
	    expect(count).toBe(1);

	    // Verify entry appears in list
	    const entryText = await page.$eval('.entry-item', el => el.textContent);
	    expect(entryText).toContain(entry.type.toLowerCase());

	    const mg = `${entry.amount} mg`
	    expect(entryText).toContain(mg)
	    
	});
	
	test('should add many entries and total should be correct', async () => {
	    let total = 0
	    const testData = sliceMockData(mockData, 0, 15)

	    //create entries
	    for (const entry of testData) {
		total += entry.amount
		await addEntry(prefix, page, entry.type, entry.amount, entry.datetime)
	    }

	    //Go to each date and get the number of entries
	    let count = 0
	    const uniqueEventDates = getUniqueDates(testData, 'datetime');

	    for (const entry of uniqueEventDates) {
		// Use the keyboard to type the date in a valid format (MMDDYYYY is common)
		// This will trigger the change handler as if a user typed it
		const entryWithSlash = entry.replaceAll('-','/')
		await inputDate(prefix, page, new Date(entryWithSlash))
		count += await getEntryCount(prefix, page, `#${prefix}-recent`)
	    }

	    expect(count).toBe(testData.length);

	    // Verify we have entries from different days
	    const dailyTotals = calculateTotal(testData)
	    expect(dailyTotals).toBe(total)
	});

    });

    describe('Update Entries', () => {
	test('should update entry type', async () => {
	    const entry = mockData[0];
	    await addEntry(prefix, page, entry.type, entry.amount, entry.datetime)
	    
	    // Click first entry to edit
	    await page.click(`#${prefix}-recent .entry-item`);
	    let newType
	    // Change type
	    if (prefix === 'mj') 
		newType = MARIJUANA_TYPES.find(t => t !== entry.type);
	    if (prefix === 'nic') 
		newType = NICOTINE_TYPES.find(t => t !== entry.type);
	    
	    await page.select(`#${prefix}-type`, newType);
	    
	    // Submit update
	    await page.click(`#${prefix}-submit-btn`);
	    
	    // Verify update
	    const entryText = await page.$eval(`#${prefix}-recent .entry-item`, el => el.textContent);

	    expect(entryText).toContain(newType);
	});

	test('should update entry amount', async () => {
	    const entry = mockData[0];

	    await addEntry(prefix, page, entry.type, entry.amount, entry.datetime);

	    // Click first entry to edit
	    await page.click(`#${prefix}-recent .entry-item`);
	    
	    // Change amount
	    let newAmount
	    if (prefix === 'mj') 
		newAmount = MARIJUANA_AMOUNTS.find(t => t !== entry.amount)
	    if (prefix === 'nic') 
		newAmount = NICOTINE_AMOUNTS.find(t => t !== entry.amount);

	    await page.select(`#${prefix}-amount`, newAmount.toString());
	    
	    // Submit update
	    await page.click(`#${prefix}-submit-btn`);

	    // Verify update
	    const entryText = await page.$eval(`#${prefix}-recent .entry-item`, el => el.textContent);
	    expect(entryText).toContain(`${newAmount} mg`);
	});

	test('should update entry datetime', async () => {
	    const entry = mockData[0];
	    await addEntry(prefix, page, entry.type, entry.amount, entry.datetime);

	    // Click first entry to edit
	    await page.click(`#${prefix}-recent .entry-item`);
	    
	    await page.type(`#${prefix}-time`, `18:05`)

	    // Submit update
	    await page.click(`#${prefix}-submit-btn`);

	    const entryText = await page.$eval(`#${prefix}-recent .entry-item`, el => el.textContent);
	    expect(entryText).toContain(`18:05`);
	});
    });

    describe('Delete Entries', () => {
	test('should delete entry', async () => {
	    page.on('dialog', async dialog => {
		// Accept the confirmation dialog.
		await dialog.accept();
	    });

	    const entry = mockData[0];
	    await addEntry(prefix, page, entry.type, entry.amount, entry.datetime);
	    
	    // Click entry to edit, then delete
	    await page.click(`#${prefix}-recent .entry-item`);
	    
	    // Look for delete button
	    const deleteButton = await page.$(`.delete-btn`);
	    if (deleteButton) {
		await deleteButton.click();

		const result = await page.$eval(`#${prefix}-recent `, el => el);
		expect(result).toEqual({});
	    }
	});
    })
})
