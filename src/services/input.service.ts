import { Page } from 'puppeteer';
import { handleButton, ButtonOptions } from '../handlers/button.handler';
import { handleCheckbox } from '../handlers/checkbox.handler';
import { handleInput, fillForm, InputOptions } from '../handlers/input.handler';

export { ButtonOptions, InputOptions };

export class InputService {
    constructor(private page: Page) { }

    async handleButton(
        selector: string,
        options: ButtonOptions = {}
    ): Promise<boolean> {
        return handleButton(this.page, selector, options);
    }

    async handleCheckbox(
        selector: string,
        expectedState: boolean = true
    ): Promise<boolean> {
        return handleCheckbox(this.page, selector, expectedState);
    }

    async handleInput(
        selector: string,
        value: string,
        options: InputOptions = {}
    ): Promise<boolean> {
        return handleInput(this.page, selector, value, options);
    }

    async fillForm(
        formData: { selector: string; value: string; isPassword?: boolean }[]
    ): Promise<boolean> {
        return fillForm(this.page, formData);
    }
}
