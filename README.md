# Penguin Meds Test Suite

Automated end-to-end testing for the Penguin Meds application using Puppeteer and Jest.

## Installation

```bash
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with coverage
npm run test:coverage

# Run debug test only
npm run test:debug

# Run debug test in headed mode
npm run test:debug:headed
```

## Troubleshooting

### "Socket hang up" errors

If you see socket hang up errors, try:

1. **Run the debug test first:**
   ```bash
   npm run test:debug:headed
   ```
   This will help identify if it's a connection issue.

2. **Check your internet connection** - The tests need to access the live website.

3. **Try increasing timeouts** - Edit `jest.config.js` and increase `testTimeout` to 120000.

4. **Run tests one at a time:**
   ```bash
   npm test -- tests/marijuana.test.js
   npm test -- tests/nicotine.test.js
   ```

5. **Check if the website is accessible** - Open https://bartonhammond.github.io/penquinmeds/ in your browser.

6. **Install/reinstall Puppeteer:**
   ```bash
   npm uninstall puppeteer
   npm install puppeteer
   ```

## Project Structure

```
penguinmeds-tests/
├── package.json
├── jest.config.js
├── tests/
│   ├── marijuana.test.js
│   ├── nicotine.test.js
│   └── helpers/
│       └── testUtils.js
└── README.md
```

## Test Coverage

- ✅ Add marijuana entries
- ✅ Update marijuana entries
- ✅ Delete marijuana entries
- ✅ Add nicotine entries
- ✅ Update nicotine entries
- ✅ Delete nicotine entries
- ✅ Verify chart totals for each day
- ✅ Mock data generation for full week

## Features

- Generates mock data for a complete 7-day week
- Tests CRUD operations for both marijuana and nicotine forms
- Validates chart data reflects correct totals
- Cleans up test data after each run
- Headless and headed modes available

## Notes
### To debug the test script,
*  put `debugger` somewhere
*  run `$ npm run debug -- tests/marijuana.test.js`
*  in browser `chrome://inspect/#devices`
