import { Page } from 'puppeteer';
export declare function handleProfileCompletionModal(page: Page): Promise<void>;
export declare function handleSecurityQuestionModal(page: Page, securityAnswer: string): Promise<boolean>;
