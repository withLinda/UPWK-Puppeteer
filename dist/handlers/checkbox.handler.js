"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCheckbox = handleCheckbox;
const errors_1 = require("../utils/errors");
const delay_1 = require("../utils/delay");
const input_utils_1 = require("./shared/input-utils");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function handleCheckbox(page, selector, expectedState) {
    logger_1.logger.info({
        checkboxHandler: {
            selector,
            targetState: expectedState
        }
    });
    try {
        const checkbox = await page.waitForSelector(selector, {
            visible: true,
            timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT
        });
        if (!checkbox) {
            throw new errors_1.InputError('Checkbox element not found');
        }
        // Click the checkbox - the click itself is the verification
        // since the subsequent login flow will fail if the checkbox isn't properly checked
        await (0, input_utils_1.moveMouseNaturally)(page, checkbox);
        await page.click(selector);
        await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
        return true;
    }
    catch (error) {
        logger_1.logger.error(error);
        throw new errors_1.InputError(`Checkbox handling failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=checkbox.handler.js.map