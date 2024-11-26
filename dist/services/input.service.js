"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputService = void 0;
const button_handler_1 = require("../handlers/button.handler");
const checkbox_handler_1 = require("../handlers/checkbox.handler");
const input_handler_1 = require("../handlers/input.handler");
class InputService {
    constructor(page) {
        this.page = page;
    }
    async handleButton(selector, options = {}) {
        return (0, button_handler_1.handleButton)(this.page, selector, options);
    }
    async handleCheckbox(selector, expectedState = true) {
        return (0, checkbox_handler_1.handleCheckbox)(this.page, selector, expectedState);
    }
    async handleInput(selector, value, options = {}) {
        return (0, input_handler_1.handleInput)(this.page, selector, value, options);
    }
    async fillForm(formData) {
        return (0, input_handler_1.fillForm)(this.page, formData);
    }
}
exports.InputService = InputService;
//# sourceMappingURL=input.service.js.map