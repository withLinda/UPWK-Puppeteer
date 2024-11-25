import { Page } from 'puppeteer';
export declare class AuthFlowService {
    private page;
    private inputService;
    constructor(page: Page);
    handleCookieConsent(): Promise<void>;
    handleSecurityQuestion(securityAnswer: string): Promise<boolean>;
    handleProfileModal(): Promise<void>;
    handlePopovers(): Promise<void>;
    performLogin(email: string, password: string, securityAnswer: string): Promise<boolean>;
    attemptStoredLogin(): Promise<boolean>;
}
