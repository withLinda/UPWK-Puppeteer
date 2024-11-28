# UPWK-Puppeteer

A simple automation tool that saves you from the hassle of repetitive logins. Built with Puppeteer and TypeScript, this tool handles the login process and saves your authentication data (cookies and localStorage) so you don't have to keep logging in manually.

## What it does

- Automates the login process
- Saves your authentication data for future use
- Attempts to use stored auth data before going through the full login flow
- Handles security questions and cookie consent automatically
- Provides detailed logging for troubleshooting

## Tech Used

- TypeScript (for type safety and better code organization)
- Puppeteer (for browser automation)
- puppeteer-real-browser (for using your actual Chrome installation)
- Node.js

## Getting Started

1. Make sure you have:
   - Node.js installed
   - Chrome browser installed
   - Your login credentials handy

2. Clone and install:
   ```bash
   git clone https://github.com/withLinda/UPWK-Puppeteer.git
   cd UPWK-Puppeteer
   npm install
   ```

3. Set up your environment:
   Create a `.env` file in the project root with:
   ```env
   email=your_email
   password=your_password
   securityAnswer=your_security_answer
   ```

## How to Use

Build the project first:
```bash
npm run build
```

Then run it:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Project Structure

```
src/
├── config/         # App configuration
├── services/      # Core functionality
├── handlers/      # Event handlers
├── utils/         # Helper functions
└── index.ts       # Entry point
```

## License

MIT License - feel free to use and modify as needed!
