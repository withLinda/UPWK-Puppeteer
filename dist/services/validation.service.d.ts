import { Page } from 'puppeteer';
export declare const INPUT_CONFIG: {
    VERIFICATION_TIMEOUT: number;
};
export declare class ValidationService {
    /**
     * Verifies if the input value matches the expected value
     * @param page Puppeteer Page instance
     * @param selector Element selector to verify
     * @param expectedValue The value we expect to see in the input
     * @param timeout Maximum time to wait for verification (default 5000ms)
     * @returns Promise<boolean> True if input matches expected value, false otherwise
     */
    static verifyInputValue(page: Page, selector: string, expectedValue: string, timeout?: number): Promise<boolean>;
    /**
     * Validates input by checking if it exists and matches expected value
     * @param value The input value to validate
     * @param type The type of input being validated
     * @returns boolean True if validation passes
     */
    static validateInput(value: string, type: 'email' | 'password' | 'security-answer'): boolean;
}
