import { Page } from 'puppeteer';
export declare class AuthFlowService {
    private page;
    private inputService;
    private loginState;
    constructor(page: Page);
    private elementExists;
    handleProfileModal(): Promise<void>;
    attemptStoredLogin(): Promise<boolean>;
    performLogin(email: string, password: string, securityAnswer: string): Promise<boolean>;
}
