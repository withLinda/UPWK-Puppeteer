"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
exports.randomDelay = randomDelay;
exports.getRandomDelayFromTuple = getRandomDelayFromTuple;
exports.createDelayTuple = createDelayTuple;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomDelayFromTuple(delayTuple) {
    const [min, max] = delayTuple;
    return randomDelay(min, max);
}
// Helper to ensure tuple type safety
function createDelayTuple(min, max) {
    return [min, max];
}
//# sourceMappingURL=delay.js.map