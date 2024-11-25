export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomDelayFromTuple(delayTuple: [number, number]): number {
    const [min, max] = delayTuple;
    return randomDelay(min, max);
}

// Helper to ensure tuple type safety
export function createDelayTuple(min: number, max: number): [number, number] {
    return [min, max];
}
