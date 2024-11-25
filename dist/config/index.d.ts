import type { BrowserConfig } from './types';
declare const config: {
    CHROME_PATH: string;
    STORAGE_PATHS: {
        readonly COOKIE_PATH: string;
        readonly LOCALSTORAGE_PATH: string;
    };
    BROWSER_CONFIG: BrowserConfig;
    URLS: {
        readonly LOGIN: "https://www.upwork.com/ab/account-security/login";
        readonly DASHBOARD: "https://www.upwork.com/nx/find-work/best-matches";
    };
    SELECTORS: {
        readonly LOGIN: {
            readonly EMAIL_INPUT: "input#login_username";
            readonly PASSWORD_INPUT: "input#login_password";
            readonly SECURITY_QUESTION_INPUT: "#login_answer";
            readonly EMAIL_CONTINUE_BUTTON: "button#login_password_continue";
            readonly PASSWORD_CONTINUE_BUTTON: "button#login_control_continue";
            readonly KEEP_LOGGED_IN_CHECKBOX: "span[data-test=\"checkbox-input\"]";
            readonly REMEMBER_DEVICE_CHECKBOX: "span[data-test=\"checkbox-input\"]";
        };
        readonly MODALS: {
            readonly PROFILE_MODAL: "div.air3-fullscreen-container div.profile-completeness-modal-container";
            readonly CLOSE_BUTTONS: readonly ["button.air3-modal-close", "button.air3-btn.air3-btn-primary", "div.air3-modal-footer button.air3-btn.air3-btn-primary"];
        };
        readonly POPOVERS: {
            readonly CLOSE_BUTTON: "button[data-cy=\"nav-popover-close-btn\"]";
            readonly GOT_IT_BUTTON: "button.air3-btn.air3-btn-primary";
        };
        readonly COOKIE_CONSENT: {
            readonly ACCEPT_BUTTON: "#onetrust-accept-btn-handler";
            readonly BANNER: "#onetrust-banner-sdk";
        };
        readonly LOGIN_VERIFICATION: {
            readonly SIDEBAR_PROFILE: "#fwh-sidebar-profile";
            readonly CONNECTS_CARD: "div[data-test=\"sidebar-connects-card\"]";
            readonly PROFILE_COMPLETENESS: "section[data-test=\"profile-completeness-nudges\"]";
            readonly PROMOTE_CARD: "div[data-test=\"sidebar-promote-card\"]";
            readonly FREELANCER_NAME: "div[data-test=\"freelancer-sidebar-profile\"] h3.h5";
        };
    };
    TIMING: {
        readonly NAVIGATION_TIMEOUT: 30000;
        readonly ELEMENT_WAIT_TIMEOUT: 10000;
        readonly DELAYS: {
            readonly SHORT: [number, number];
            readonly MEDIUM: [number, number];
            readonly LONG: [number, number];
            readonly TYPE: {
                readonly SPECIAL_CHAR: [number, number];
                readonly NORMAL_CHAR: [number, number];
            };
        };
    };
    CRITICAL_COOKIES: readonly ["user_uid", "recognized", "master_access_token"];
    INPUT_CONFIG: {
        readonly MAX_ATTEMPTS: 3;
        readonly VERIFICATION_TIMEOUT: 10000;
    };
};
export declare const CHROME_PATH: string, STORAGE_PATHS: {
    readonly COOKIE_PATH: string;
    readonly LOCALSTORAGE_PATH: string;
}, BROWSER_CONFIG: BrowserConfig, URLS: {
    readonly LOGIN: "https://www.upwork.com/ab/account-security/login";
    readonly DASHBOARD: "https://www.upwork.com/nx/find-work/best-matches";
}, SELECTORS: {
    readonly LOGIN: {
        readonly EMAIL_INPUT: "input#login_username";
        readonly PASSWORD_INPUT: "input#login_password";
        readonly SECURITY_QUESTION_INPUT: "#login_answer";
        readonly EMAIL_CONTINUE_BUTTON: "button#login_password_continue";
        readonly PASSWORD_CONTINUE_BUTTON: "button#login_control_continue";
        readonly KEEP_LOGGED_IN_CHECKBOX: "span[data-test=\"checkbox-input\"]";
        readonly REMEMBER_DEVICE_CHECKBOX: "span[data-test=\"checkbox-input\"]";
    };
    readonly MODALS: {
        readonly PROFILE_MODAL: "div.air3-fullscreen-container div.profile-completeness-modal-container";
        readonly CLOSE_BUTTONS: readonly ["button.air3-modal-close", "button.air3-btn.air3-btn-primary", "div.air3-modal-footer button.air3-btn.air3-btn-primary"];
    };
    readonly POPOVERS: {
        readonly CLOSE_BUTTON: "button[data-cy=\"nav-popover-close-btn\"]";
        readonly GOT_IT_BUTTON: "button.air3-btn.air3-btn-primary";
    };
    readonly COOKIE_CONSENT: {
        readonly ACCEPT_BUTTON: "#onetrust-accept-btn-handler";
        readonly BANNER: "#onetrust-banner-sdk";
    };
    readonly LOGIN_VERIFICATION: {
        readonly SIDEBAR_PROFILE: "#fwh-sidebar-profile";
        readonly CONNECTS_CARD: "div[data-test=\"sidebar-connects-card\"]";
        readonly PROFILE_COMPLETENESS: "section[data-test=\"profile-completeness-nudges\"]";
        readonly PROMOTE_CARD: "div[data-test=\"sidebar-promote-card\"]";
        readonly FREELANCER_NAME: "div[data-test=\"freelancer-sidebar-profile\"] h3.h5";
    };
}, TIMING: {
    readonly NAVIGATION_TIMEOUT: 30000;
    readonly ELEMENT_WAIT_TIMEOUT: 10000;
    readonly DELAYS: {
        readonly SHORT: [number, number];
        readonly MEDIUM: [number, number];
        readonly LONG: [number, number];
        readonly TYPE: {
            readonly SPECIAL_CHAR: [number, number];
            readonly NORMAL_CHAR: [number, number];
        };
    };
}, CRITICAL_COOKIES: readonly ["user_uid", "recognized", "master_access_token"], INPUT_CONFIG: {
    readonly MAX_ATTEMPTS: 3;
    readonly VERIFICATION_TIMEOUT: 10000;
};
export default config;
