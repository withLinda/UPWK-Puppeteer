"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
exports.getRandomDelayFromTuple = getRandomDelayFromTuple;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Internal helper function for generating random delays
function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomDelayFromTuple(delayTuple) {
    const [min, max] = delayTuple;
    return randomDelay(min, max);
}
//# sourceMappingURL=delay.js.map