"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserConfig = exports.chromePath = void 0;
exports.chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
exports.browserConfig = {
    executablePath: exports.chromePath,
    headless: false,
    turnstile: true,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
    disableXvfb: true,
    connectOption: {
        defaultViewport: null,
    },
};
//# sourceMappingURL=browser.js.map