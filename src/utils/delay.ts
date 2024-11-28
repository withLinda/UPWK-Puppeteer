export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Internal helper function for generating random delays
function randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomDelayFromTuple(delayTuple: [number, number]): number {
    const [min, max] = delayTuple;
    return randomDelay(min, max);
}
