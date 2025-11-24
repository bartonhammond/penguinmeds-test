# Penguin Meds Test Suite

Automated end-to-end testing for the Penguin Meds application using Puppeteer and Jest.
buddy 
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