"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCookieConsent = handleCookieConsent;
const input_service_1 = require("../services/input.service");
const delay_1 = require("../utils/delay");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function handleCookieConsent(page) {
    try {
        logger_1.logger.info('Starting cookie consent handler');
        const inputService = new input_service_1.InputService(page);
        await (0, delay_1.delay)(1000); // Wait for dynamic content
        const bannerState = await page.evaluate(() => {
            const state = {
                outerExists: false,
                innerExists: false,
                outerHidden: true,
                innerHidden: true,
                buttonExists: false,
                buttonHidden: true
            };
            const banner = document.querySelector('#onetrust-consent-sdk');
            if (!banner)
                return state;
            state.outerExists = true;
            state.outerHidden = banner.style.display === 'none' ||
                banner.style.visibility === 'hidden' ||
                banner.style.opacity === '0';
            const bannerSdk = banner.querySelector('#onetrust-banner-sdk');
            if (!bannerSdk)
                return state;
            state.innerExists = true;
            state.innerHidden = bannerSdk.style.display === 'none' ||
                bannerSdk.style.visibility === 'hidden' ||
                bannerSdk.style.opacity === '0';
            const button = banner.querySelector('#onetrust-accept-btn-handler');
            if (button) {
                state.buttonExists = true;
                state.buttonHidden = button.style.display === 'none' ||
                    button.style.visibility === 'hidden' ||
                    button.style.opacity === '0';
            }
            return state;
        });
        logger_1.logger.info({ bannerState });
        const bannerVisible = bannerState.outerExists &&
            !bannerState.outerHidden &&
            bannerState.innerExists &&
            !bannerState.innerHidden;
        if (bannerVisible) {
            try {
                const buttonElement = await page.waitForSelector(config_1.SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON, {
                    visible: true,
                    timeout: 5000
                });
                if (!buttonElement) {
                    logger_1.logger.warn('Accept button not found after waiting');
                    return;
                }
                await (0, delay_1.delay)(1000); // Wait for animations
                const buttonMetrics = await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (!button)
                        return null;
                    const rect = button.getBoundingClientRect();
                    const styles = window.getComputedStyle(button);
                    return {
                        position: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        styles: {
                            display: styles.display,
                            visibility: styles.visibility,
                            opacity: styles.opacity,
                            pointerEvents: styles.pointerEvents
                        }
                    };
                }, config_1.SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
                logger_1.logger.info({ buttonMetrics });
                // Direct click for cookie consent
                await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (button && button instanceof HTMLElement) {
                        button.click();
                    }
                }, config_1.SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
                // Wait for banner to disappear
                await page.waitForFunction(() => {
                    const banner = document.querySelector('#onetrust-consent-sdk');
                    if (!banner)
                        return true;
                    const bannerSdk = banner.querySelector('#onetrust-banner-sdk');
                    if (!bannerSdk)
                        return true;
                    const state = {
                        outerHidden: banner instanceof HTMLElement && (banner.style.display === 'none' ||
                            banner.style.visibility === 'hidden' ||
                            banner.style.opacity === '0'),
                        innerHidden: bannerSdk instanceof HTMLElement && (bannerSdk.style.display === 'none' ||
                            bannerSdk.style.visibility === 'hidden' ||
                            bannerSdk.style.opacity === '0')
                    };
                    return state.outerHidden || state.innerHidden;
                }, { timeout: 5000 });
                const finalState = await page.evaluate(() => {
                    const banner = document.querySelector('#onetrust-consent-sdk');
                    return {
                        exists: !!banner,
                        visible: banner instanceof HTMLElement && (banner.style.display !== 'none' &&
                            banner.style.visibility !== 'hidden' &&
                            banner.style.opacity !== '0')
                    };
                });
                logger_1.logger.info({ finalState });
            }
            catch (error) {
                logger_1.logger.error(error);
            }
        }
        else {
            logger_1.logger.info('No active cookie consent banner detected');
        }
    }
    catch (error) {
        logger_1.logger.error(error);
        const pageState = await page.evaluate(() => {
            const banner = document.querySelector('#onetrust-consent-sdk');
            return {
                bannerExists: !!banner,
                bannerVisible: banner instanceof HTMLElement && (banner.style.display !== 'none' &&
                    banner.style.visibility !== 'hidden' &&
                    banner.style.opacity !== '0'),
                url: window.location.href,
                documentReady: document.readyState
            };
        });
        logger_1.logger.error({ pageState });
    }
}
//# sourceMappingURL=cookie-consent.handler.js.map