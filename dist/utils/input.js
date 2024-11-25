"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeWithNaturalSpeed = exports.waitForInputValue = exports.moveMouseInNaturalWay = void 0;
const delay_1 = require("./delay");
const moveMouseInNaturalWay = async (page, element) => {
    const box = await element.boundingBox();
    if (!box)
        return;
    const targetX = box.x + box.width / 2 + (0, delay_1.randomDelay)(-10, 10);
    const targetY = box.y + box.height / 2 + (0, delay_1.randomDelay)(-5, 5);
    const steps = (0, delay_1.randomDelay)(5, 10);
    await page.mouse.move(targetX, targetY, { steps });
    await (0, delay_1.delay)((0, delay_1.randomDelay)(50, 150));
};
exports.moveMouseInNaturalWay = moveMouseInNaturalWay;
const waitForInputValue = async (page, selector, expectedValue, timeout = 10000) => {
    const startTime = Date.now();
    let lastValue = "";
    while (Date.now() - startTime < timeout) {
        const currentValue = await page.evaluate((sel) => {
            const input = document.querySelector(sel);
            return input ? input.value : "";
        }, selector);
        if (currentValue === expectedValue) {
            return true;
        }
        if (currentValue !== lastValue) {
            console.log("Current input value:", currentValue);
            lastValue = currentValue;
        }
        await (0, delay_1.delay)(100);
    }
    return false;
};
exports.waitForInputValue = waitForInputValue;
const typeWithNaturalSpeed = async (page, text, isPassword = false) => {
    console.log(`Starting to type ${isPassword ? "password" : "text"}...`);
    for (const char of text) {
        await page.keyboard.type(char);
        if (!isPassword && (char === "@" || char === ".")) {
            await (0, delay_1.delay)((0, delay_1.randomDelay)(400, 800));
        }
        else {
            await (0, delay_1.delay)((0, delay_1.randomDelay)(100, 200));
        }
    }
    console.log("Typing complete, waiting for input to settle...");
    await (0, delay_1.delay)((0, delay_1.randomDelay)(1000, 2000));
};
exports.typeWithNaturalSpeed = typeWithNaturalSpeed;
//# sourceMappingURL=input.js.map