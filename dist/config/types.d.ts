import { Viewport } from 'puppeteer';
export interface BrowserConfig {
    executablePath: string;
    defaultViewport: Viewport;
    headless: boolean;
    args: string[];
}
export interface DelayTuple extends Array<number> {
    0: number;
    1: number;
    length: 2;
}
export interface TypeDelays {
    SPECIAL_CHAR: DelayTuple;
    NORMAL_CHAR: DelayTuple;
}
export interface Delays {
    SHORT: DelayTuple;
    MEDIUM: DelayTuple;
    LONG: DelayTuple;
    TYPE: TypeDelays;
}
export interface LoginSelectors {
    EMAIL_INPUT: string;
    PASSWORD_INPUT: string;
    SECURITY_QUESTION_INPUT: string;
    EMAIL_CONTINUE_BUTTON: string;
    PASSWORD_CONTINUE_BUTTON: string;
    REMEMBER_DEVICE_CHECKBOX: string;
}
export interface ModalSelectors {
    PROFILE_MODAL: string;
    CLOSE_BUTTONS: readonly string[];
}
export interface PopoverSelectors {
    CLOSE_BUTTON: string;
    GOT_IT_BUTTON: string;
}
export interface CookieConsentSelectors {
    ACCEPT_BUTTON: string;
    BANNER: string;
}
export interface LoginVerificationSelectors {
    CONNECTS_CARD: string;
}
export interface Selectors {
    readonly LOGIN: LoginSelectors;
    readonly MODALS: ModalSelectors;
    readonly POPOVERS: PopoverSelectors;
    readonly COOKIE_CONSENT: CookieConsentSelectors;
    readonly LOGIN_VERIFICATION: LoginVerificationSelectors;
}
export interface StoragePaths {
    readonly COOKIE_PATH: string;
    readonly LOCALSTORAGE_PATH: string;
}
export interface Urls {
    readonly LOGIN: string;
    readonly DASHBOARD: string;
}
export interface TimingConfig {
    readonly NAVIGATION_TIMEOUT: number;
    readonly ELEMENT_WAIT_TIMEOUT: number;
    readonly DELAYS: Delays;
}
export interface InputConfig {
    readonly MAX_ATTEMPTS: number;
    readonly VERIFICATION_TIMEOUT: number;
}
