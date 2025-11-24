const { BASE_URL, launchBrowser } = require('./helpers/testUtils');

describe('Debug Connection Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    console.log('Launching browser...');
    browser = await launchBrowser();
    console.log('Browser launched successfully');
  });

  afterAll(async () => {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed');
    }
  });

  test('should connect to the website', async () => {
    console.log('Creating new page...');
    page = await browser.newPage();
    
    console.log(`Navigating to ${BASE_URL}...`);
    await page.setDefaultNavigationTimeout(30000);
    
    const response = await page.goto(BASE_URL, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('Page loaded, status:', response.status());
    expect(response.status()).toBe(200);
    
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toBeTruthy();
    
    await page.close();
  }, 45000);
});
