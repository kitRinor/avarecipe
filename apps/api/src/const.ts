// Temporary User ID for development until Auth is implemented.
export const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000';


// Validation regex and constants for user registration and profile updates.
export const USER_HANDLE_REGEX = /^[a-z0-9_-]{3,15}$/; // Lowercase letters, numbers, underscores, hyphens, 3-15 chars
export const USER_PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[_\-+:;?!/^~=\-*<>@,.\\])[a-zA-Z0-9_\-+:;?!/^~=\-*<>@,.\\]{8,}$/; // Min 8 chars, at least one letter, one number, one special char
export const MIN_USER_DISPLAY_NAME_LENGTH = 3;
export const MAX_USER_DISPLAY_NAME_LENGTH = 50;