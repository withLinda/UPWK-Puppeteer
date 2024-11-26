import { Page } from 'puppeteer';
import { InputService } from '../services/input.service';
import { delay } from '../utils/delay';
import { SELECTORS } from '../config';
import { logger } from '../utils/logger';

interface BannerState {
    outerExists: boolean;
    innerExists: boolean;
    outerHidden: boolean;
    innerHidden: boolean;
    buttonExists: boolean;
    buttonHidden: boolean;
}

export async function handleCookieConsent(page: Page): Promise<void> {
    try {
        logger.info('Starting cookie consent handler');
        const inputService = new InputService(page);

        await delay(1000); // Wait for dynamic content

        const bannerState = await page.evaluate((): BannerState => {
            const state: BannerState = {
                outerExists: false,
                innerExists: false,
                outerHidden: true,
                innerHidden: true,
                buttonExists: false,
                buttonHidden: true
            };

            const banner = document.querySelector<HTMLElement>('#onetrust-consent-sdk');
            if (!banner) return state;

            state.outerExists = true;
            state.outerHidden = banner.style.display === 'none' ||
                banner.style.visibility === 'hidden' ||
                banner.style.opacity === '0';

            const bannerSdk = banner.querySelector<HTMLElement>('#onetrust-banner-sdk');
            if (!bannerSdk) return state;

            state.innerExists = true;
            state.innerHidden = bannerSdk.style.display === 'none' ||
                bannerSdk.style.visibility === 'hidden' ||
                bannerSdk.style.opacity === '0';

            const button = banner.querySelector<HTMLElement>('#onetrust-accept-btn-handler');
            if (button) {
                state.buttonExists = true;
                state.buttonHidden = button.style.display === 'none' ||
                    button.style.visibility === 'hidden' ||
                    button.style.opacity === '0';
            }

            return state;
        });

        logger.info({ bannerState });

        const bannerVisible = bannerState.outerExists &&
            !bannerState.outerHidden &&
            bannerState.innerExists &&
            !bannerState.innerHidden;

        if (bannerVisible) {
            try {
                const buttonElement = await page.waitForSelector(SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON, {
                    visible: true,
                    timeout: 5000
                });

                if (!buttonElement) {
                    logger.warn('Accept button not found after waiting');
                    return;
                }

                await delay(1000); // Wait for animations

                const buttonMetrics = await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (!button) return null;

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
                }, SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);

                logger.info({ buttonMetrics });

                // Direct click for cookie consent
                await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (button && button instanceof HTMLElement) {
                        button.click();
                    }
                }, SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);

                // Wait for banner to disappear
                await page.waitForFunction(
                    () => {
                        const banner = document.querySelector('#onetrust-consent-sdk');
                        if (!banner) return true;

                        const bannerSdk = banner.querySelector('#onetrust-banner-sdk');
                        if (!bannerSdk) return true;

                        const state = {
                            outerHidden: banner instanceof HTMLElement && (
                                banner.style.display === 'none' ||
                                banner.style.visibility === 'hidden' ||
                                banner.style.opacity === '0'
                            ),
                            innerHidden: bannerSdk instanceof HTMLElement && (
                                bannerSdk.style.display === 'none' ||
                                bannerSdk.style.visibility === 'hidden' ||
                                bannerSdk.style.opacity === '0'
                            )
                        };

                        return state.outerHidden || state.innerHidden;
                    },
                    { timeout: 5000 }
                );

                const finalState = await page.evaluate(() => {
                    const banner = document.querySelector('#onetrust-consent-sdk');
                    return {
                        exists: !!banner,
                        visible: banner instanceof HTMLElement && (
                            banner.style.display !== 'none' &&
                            banner.style.visibility !== 'hidden' &&
                            banner.style.opacity !== '0'
                        )
                    };
                });

                logger.info({ finalState });
            } catch (error) {
                logger.error(error);
            }
        } else {
            logger.info('No active cookie consent banner detected');
        }
    } catch (error) {
        logger.error(error);

        const pageState = await page.evaluate(() => {
            const banner = document.querySelector('#onetrust-consent-sdk');
            return {
                bannerExists: !!banner,
                bannerVisible: banner instanceof HTMLElement && (
                    banner.style.display !== 'none' &&
                    banner.style.visibility !== 'hidden' &&
                    banner.style.opacity !== '0'
                ),
                url: window.location.href,
                documentReady: document.readyState
            };
        });

        logger.error({ pageState });
    }
}
