import { Page, ElementHandle } from 'puppeteer';
import { DelayTuple } from '../config/types';
export interface InputOptions {
    preTypeDelay?: DelayTuple;
    postTypeDelay?: DelayTuple;
    maxAttempts?: number;
    isPassword?: boolean;
}
export declare class InputService {
    private page;
    constructor(page: Page);
    moveMouseNaturally(element: ElementHandle): Promise<void>;
    private typeNaturally;
    private verifyInputValue;
    verifyCheckboxState(selector: string, expectedState?: boolean, timeout?: number): Promise<boolean>;
    handleCheckbox(selector: string, expectedState?: boolean): Promise<boolean>;
    handleInput(selector: string, value: string, options?: InputOptions): Promise<boolean>;
    fillForm(formData: {
        selector: string;
        value: string;
        isPassword?: boolean;
    }[]): Promise<boolean>;
}
