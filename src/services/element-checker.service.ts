import { Page } from 'puppeteer';
import { TIMING } from '../config';
import { logger } from '../utils/logger';

export class ElementCheckerService {
    constructor(private page: Page) { }

    async elementExists(selector: string, timeout = TIMING.ELEMENT_WAIT_TIMEOUT): Promise<boolean> {
        try {
            const element = await this.page.waitForSelector(selector, {
                visible: true,
                timeout: timeout
            });
            const exists = element !== null;

            if (exists) {
                const elementState = await this.page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;

                    const rect = el.getBoundingClientRect();
                    const styles = window.getComputedStyle(el);

                    return {
                        visible: styles.display !== 'none' &&
                            styles.visibility !== 'hidden' &&
                            styles.opacity !== '0',
                        position: {
                            top: rect.top,
                            left: rect.left,
                            bottom: rect.bottom,
                            right: rect.right
                        },
                        styles: {
                            display: styles.display,
                            visibility: styles.visibility,
                            opacity: styles.opacity,
                            zIndex: styles.zIndex
                        },
                        attributes: {
                            disabled: el.hasAttribute('disabled'),
                            ariaHidden: el.getAttribute('aria-hidden'),
                            ariaDisabled: el.getAttribute('aria-disabled')
                        }
                    };
                }, selector);

                logger.info({ elementCheck: { selector, exists, state: elementState } });
            }

            return exists;
        } catch (error) {
            logger.info({ elementCheck: { selector, exists: false, error } });
            return false;
        }
    }
}
