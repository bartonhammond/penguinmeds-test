const { BASE_URL } = require('./helpers/testUtils');
const title = "Penguin Meds"

describe('Debug Connection Test', () => {
    beforeAll(async () => {
	console.log('Launching browser...');
      	await page.goto('http://localhost:8000/')
	console.log('Browser launched successfully');
    });


    test('should connect to the website', async () => {
	await expect(page.title()).resolves.toMatch(`${title}`)
    }, 45000);
});
