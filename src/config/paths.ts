import path from 'path';

export const COOKIE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "auth",
    "cookies",
    "auth_cookies.json"
);

export const LOCALSTORAGE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "auth",
    "localStorage",
    "auth_localStorage.json"
);
