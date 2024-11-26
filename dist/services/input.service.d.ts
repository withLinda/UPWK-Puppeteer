import { Page } from 'puppeteer';
import { ButtonOptions } from '../handlers/button.handler';
import { InputOptions } from '../handlers/input.handler';
export { ButtonOptions, InputOptions };
export declare class InputService {
    private page;
    constructor(page: Page);
    handleButton(selector: string, options?: ButtonOptions): Promise<boolean>;
    handleCheckbox(selector: string, expectedState?: boolean): Promise<boolean>;
    handleInput(selector: string, value: string, options?: InputOptions): Promise<boolean>;
    fillForm(formData: {
        selector: string;
        value: string;
        isPassword?: boolean;
    }[]): Promise<boolean>;
}
