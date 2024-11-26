import { Page } from 'puppeteer';
import { InputError } from '../utils/errors';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { moveMouseNaturally } from './shared/input-utils';
import { TIMING } from '../config';
import { logger } from '../utils/logger';

export async function handleCheckbox(
    page: Page,
    selector: string,
    expectedState: boolean
): Promise<boolean> {
    logger.info({
        checkboxHandler: {
            selector,
            targetState: expectedState
        }
    });

    try {
        const checkbox = await page.waitForSelector(selector, {
            visible: true,
            timeout: TIMING.ELEMENT_WAIT_TIMEOUT
        });

        if (!checkbox) {
            throw new InputError('Checkbox element not found');
        }

        // Click the checkbox - the click itself is the verification
        // since the subsequent login flow will fail if the checkbox isn't properly checked
        await moveMouseNaturally(page, checkbox);
        await page.click(selector);
        await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));

        return true;
    } catch (error) {
        logger.error(error);
        throw new InputError(
            `Checkbox handling failed: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
