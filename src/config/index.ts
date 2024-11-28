import dotenv from 'dotenv';
import path from 'path';
import type { BrowserConfig } from './types';
import { URLS } from './sensitive/urls';

dotenv.config();

const config = {
    // Chrome executable path
    CHROME_PATH: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',

    // Storage paths
    STORAGE_PATHS: {
        COOKIE_PATH: path.join(__dirname, '../data/auth/cookies.json'),
        LOCALSTORAGE_PATH: path.join(__dirname, '../data/auth/localStorage.json'),
    } as const,

    // Browser configuration
    BROWSER_CONFIG: {
        executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
        headless: false,
        args: [
            '--start-maximized',
            '--disable-notifications',
            '--disable-extensions',
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    } as BrowserConfig,

    // Selectors
    SELECTORS: {
        LOGIN: {
            EMAIL_INPUT: 'input#login_username',
            PASSWORD_INPUT: 'input#login_password',
            SECURITY_QUESTION_INPUT: '#login_answer',
            LOGIN_PASSWORD_CONTINUE_BUTTON: 'button#login_password_continue',  // Clicked after username
            LOGIN_CONTROL_CONTINUE_BUTTON: 'button#login_control_continue',    // Clicked after password
            KEEP_LOGGED_IN_CHECKBOX: 'span[data-test="checkbox-input"]',
            REMEMBER_DEVICE_CHECKBOX: 'span[data-test="checkbox-input"]',
        },
        MODALS: {
            PROFILE_MODAL: 'div.air3-fullscreen-container div.profile-completeness-modal-container',
            CLOSE_BUTTONS: [
                'button.air3-modal-close',
                'button.air3-btn.air3-btn-primary',
                'div.air3-modal-footer button.air3-btn.air3-btn-primary',
            ],
        },
        POPOVERS: {
            CLOSE_BUTTON: 'button[data-cy="nav-popover-close-btn"]',
            GOT_IT_BUTTON: 'button.air3-btn.air3-btn-primary',
        },
        COOKIE_CONSENT: {
            ACCEPT_BUTTON: '#onetrust-accept-btn-handler',
            BANNER: '#onetrust-banner-sdk',
        },
        LOGIN_VERIFICATION: {
            SIDEBAR_PROFILE: '#fwh-sidebar-profile',
            CONNECTS_CARD: 'div[data-test="sidebar-connects-card"]',
            PROFILE_COMPLETENESS: 'section[data-test="profile-completeness-nudges"]',
            PROMOTE_CARD: 'div[data-test="sidebar-promote-card"]',
            FREELANCER_NAME: 'div[data-test="freelancer-sidebar-profile"] h3.h5',
        },
    } as const,

    // Timing configurations
    TIMING: {
        NAVIGATION_TIMEOUT: 30000,
        ELEMENT_WAIT_TIMEOUT: 10000,
        DELAYS: {
            SHORT: [500, 1000] as [number, number],
            MEDIUM: [1000, 2000] as [number, number],
            LONG: [2000, 3000] as [number, number],
            TYPE: {
                SPECIAL_CHAR: [400, 800] as [number, number],
                NORMAL_CHAR: [100, 200] as [number, number],
            },
        },
    } as const,

    // Critical cookies for authentication
    CRITICAL_COOKIES: ['user_uid', 'recognized', 'master_access_token'] as const,

    // Input handling configurations
    INPUT_CONFIG: {
        MAX_ATTEMPTS: 3,
        VERIFICATION_TIMEOUT: 10000,
    } as const,
};

export const {
    CHROME_PATH,
    STORAGE_PATHS,
    BROWSER_CONFIG,
    SELECTORS,
    TIMING,
    CRITICAL_COOKIES,
    INPUT_CONFIG,
} = config;

export { URLS };
export default config;
