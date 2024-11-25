"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserService = void 0;
const puppeteer_real_browser_1 = __importDefault(require("puppeteer-real-browser"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
class BrowserService {
    constructor() {
        this.browser = null;
        this.page = null;
    }
    async initialize() {
        if (!fs_1.default.existsSync(config_1.CHROME_PATH)) {
            throw new errors_1.BrowserError("Chrome executable not found at the specified path");
        }
        try {
            const result = await puppeteer_real_browser_1.default.connect(config_1.BROWSER_CONFIG);
            this.browser = result.browser;
            this.page = result.page;
            if (!this.page) {
                throw new errors_1.BrowserError('Failed to initialize page');
            }
            // Set viewport to match window size
            await this.page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });
            return this.page;
        }
        catch (error) {
            throw new errors_1.BrowserError(`Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async navigateTo(url) {
        if (!this.page) {
            throw new errors_1.BrowserError('Browser page not initialized');
        }
        try {
            await this.page.goto(url, {
                waitUntil: ["domcontentloaded", "networkidle0"],
                timeout: 30000,
            });
        }
        catch (error) {
            throw new errors_1.BrowserError(`Navigation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async takeScreenshot(path) {
        if (!this.page) {
            throw new errors_1.BrowserError('Browser page not initialized');
        }
        try {
            await this.page.screenshot({ path });
        }
        catch (error) {
            throw new errors_1.BrowserError(`Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async cleanup() {
        if (this.browser) {
            try {
                await this.browser.close();
            }
            catch (error) {
                console.error("Error closing browser:", error instanceof Error ? error.message : String(error));
            }
            finally {
                this.browser = null;
                this.page = null;
            }
        }
    }
    getPage() {
        if (!this.page) {
            throw new errors_1.BrowserError('Browser page not initialized');
        }
        return this.page;
    }
}
exports.BrowserService = BrowserService;
//# sourceMappingURL=browser.service.js.map