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
const logger_1 = require("../utils/logger");
class BrowserService {
    constructor() {
        this.browser = null;
        this.page = null;
    }
    async initialize() {
        logger_1.logger.info('=== Starting Browser Initialization ===');
        logger_1.logger.info(`Checking Chrome executable at: ${config_1.CHROME_PATH}`);
        if (!fs_1.default.existsSync(config_1.CHROME_PATH)) {
            throw new errors_1.BrowserError("Chrome executable not found at the specified path");
        }
        try {
            logger_1.logger.info({ config: config_1.BROWSER_CONFIG });
            const result = await puppeteer_real_browser_1.default.connect(config_1.BROWSER_CONFIG);
            this.browser = result.browser;
            this.page = result.page;
            if (!this.browser || !this.page) {
                throw new errors_1.BrowserError('Failed to initialize browser or page');
            }
            const version = await this.browser.version();
            logger_1.logger.info(`Browser version: ${version}`);
            await this.page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });
            const metrics = await this.page.metrics();
            logger_1.logger.info({ metrics });
            this.page.on('error', error => logger_1.logger.error(error));
            this.page.on('pageerror', error => logger_1.logger.error(error));
            this.page.on('console', msg => logger_1.logger.info(`Console ${msg.type()}: ${msg.text()}`));
            logger_1.logger.info('Browser initialization completed');
            return this.page;
        }
        catch (error) {
            logger_1.logger.error(error);
            throw new errors_1.BrowserError(`Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async navigateTo(url) {
        logger_1.logger.info(`Navigating to: ${url}`);
        if (!this.page) {
            throw new errors_1.BrowserError('Browser page not initialized');
        }
        try {
            const startTime = Date.now();
            await this.page.goto(url, {
                waitUntil: ["domcontentloaded", "networkidle0"],
                timeout: 30000,
            });
            const navigationTime = Date.now() - startTime;
            logger_1.logger.info({
                navigationComplete: {
                    timeTaken: `${navigationTime}ms`,
                    finalUrl: this.page.url()
                }
            });
            const metrics = await this.page.metrics();
            logger_1.logger.info({ metrics });
            const failedResources = await this.page.evaluate(() => {
                const resources = performance.getEntriesByType('resource');
                return resources
                    .filter(resource => !resource.responseEnd)
                    .map(resource => ({
                    name: resource.name,
                    duration: resource.duration,
                    type: resource.initiatorType
                }));
            });
            if (failedResources.length > 0) {
                logger_1.logger.warn({ failedResources });
            }
        }
        catch (error) {
            logger_1.logger.error(error);
            if (this.page) {
                const metrics = await this.page.metrics();
                logger_1.logger.info({ metricsAtError: metrics });
            }
            throw new errors_1.BrowserError(`Navigation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async takeScreenshot(path) {
        logger_1.logger.info(`Taking screenshot: ${path}`);
        if (!this.page) {
            throw new errors_1.BrowserError('Browser page not initialized');
        }
        try {
            const dimensions = await this.page.evaluate(() => ({
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }));
            logger_1.logger.info({ dimensions });
            await this.page.screenshot({ path });
            if (fs_1.default.existsSync(path)) {
                const stats = fs_1.default.statSync(path);
                logger_1.logger.info({
                    screenshot: {
                        size: `${stats.size} bytes`,
                        created: stats.birthtime
                    }
                });
            }
            else {
                throw new Error('Screenshot file not found after capture');
            }
        }
        catch (error) {
            logger_1.logger.error(error);
            throw new errors_1.BrowserError(`Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async cleanup() {
        logger_1.logger.info('Starting browser cleanup');
        if (this.browser) {
            try {
                if (this.page) {
                    const metrics = await this.page.metrics();
                    logger_1.logger.info({ finalMetrics: metrics });
                }
                await this.browser.close();
                this.browser = null;
                this.page = null;
                logger_1.logger.info('Browser cleanup completed');
            }
            catch (error) {
                logger_1.logger.error(error);
                throw error;
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