/**
 * Simple utility for encrypting and decrypting GitHub tokens with a user-provided password
 */

import CryptoJS from 'crypto-js';
import encryptedSettings from '../data/encryptedSettings.json';
import { commitFile } from './githubService';

/**
 * Unified password management system - ensures only one master password is used
 */

// Constants for localStorage keys - centralized for consistency
const STORAGE_KEYS = {
  MASTER_PASSWORD_HASH: 'master_password_hash',
  MASTER_PASSWORD_HINT: 'master_password_hint',
  REMEMBER_DEVICE: 'remember_device',
  SESSION_EXPIRY: 'password_session_expiry',
  ADMIN_AUTH: 'admin_auth',
  TOKEN_EXPIRY: 'token_expiry',
  GITHUB_TOKEN: 'github_token',
  TOKEN_ENCRYPTED: 'token_encrypted',
  SETUP_COMPLETE: 'admin_setup_complete',
  ENCRYPTED_DATA: 'encrypted_data' // New key for storing all encrypted data
};

// Encrypt a token with a password
export function encryptToken(token: string, password: string): string {
  if (!token || !password) return '';
  return CryptoJS.AES.encrypt(token, password).toString();
}

// Decrypt a token with a password
export function decryptToken(encryptedToken: string, password: string): string {
  if (!encryptedToken || !password) return '';
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error('Failed to decrypt token:', e);
    return '';
  }
}

// Check if a string looks like an encrypted token
export function isEncryptedToken(str: string): boolean {
  // Encrypted tokens will typically be base64-encoded strings with certain characteristics
  return /^U2FsdGVkX1.*/.test(str);
}

// Generate a hash of the password for verification purposes
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

// Verify a password against its hash
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Store the master password settings
export function saveMasterPassword(password: string, hint?: string, remember: boolean = false): void {
  // Store password hash for verification
  const passwordHash = hashPassword(password);
  localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, passwordHash);
  
  // Store hint if provided
  if (hint) {
    localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HINT, hint);
  }
  
  // Store remember preference
  localStorage.setItem(STORAGE_KEYS.REMEMBER_DEVICE, remember.toString());
  
  // If remember is true, store a session cookie that lasts longer
  if (remember) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiryDate.toISOString());
  }
}

// Encrypt and store sensitive data with the master password
export function encryptAndStoreData(key: string, data: string, password: string): void {
  // Get existing encrypted data
  const encryptedDataJson = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_DATA) || '{}';
  let encryptedDataObj;
  
  try {
    encryptedDataObj = JSON.parse(encryptedDataJson);
  } catch (e) {
    encryptedDataObj = {};
  }
  
  // Encrypt the new data
  const encrypted = encryptToken(data, password);
  
  // Store it under the specified key
  encryptedDataObj[key] = encrypted;
  
  // Save back to localStorage
  localStorage.setItem(STORAGE_KEYS.ENCRYPTED_DATA, JSON.stringify(encryptedDataObj));
}

// Decrypt stored data with the master password
export function getDecryptedData(key: string, password: string): string | null {
  const encryptedDataJson = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_DATA) || '{}';
  let encryptedDataObj;
  
  try {
    encryptedDataObj = JSON.parse(encryptedDataJson);
  } catch (e) {
    return null;
  }
  
  const encrypted = encryptedDataObj[key];
  if (!encrypted) return null;
  
  try {
    return decryptToken(encrypted, password);
  } catch (e) {
    return null;
  }
}

// Get master password settings
export function getMasterPasswordSettings(): { 
  passwordHash: string | null;
  hint: string | null; 
  remember: boolean;
  sessionValid: boolean;
} {
  const passwordHash = localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD_HASH);
  const hint = localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD_HINT);
  const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_DEVICE) === 'true';
  
  // Check if the remember session is still valid
  let sessionValid = false;
  if (remember) {
    const storedExpiryDate = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
    if (storedExpiryDate) {
      const expiryDate = new Date(storedExpiryDate);
      sessionValid = expiryDate > new Date();
    }
  }
  
  return {
    passwordHash,
    hint,
    remember,
    sessionValid
  };
}

// Clear all sensitive data and settings
export function clearAllSettings(): void {
  localStorage.removeItem(STORAGE_KEYS.MASTER_PASSWORD_HASH);
  localStorage.removeItem(STORAGE_KEYS.MASTER_PASSWORD_HINT);
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_DEVICE);
  localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_ENCRYPTED);
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_DATA);
}

// Export the storage keys for consistent usage across components
export { STORAGE_KEYS };

// For backward compatibility
export const getEncryptionSettings = getMasterPasswordSettings;
export const saveEncryptionSettings = saveMasterPassword;
export const clearEncryptionSettings = clearAllSettings;

// Add functions to read settings from the repository file
// Update this function to fetch from the deployed site
export async function loadRepoSettings(): Promise<any> {
  try {
    // Fetch the settings file from your deployed site
    const response = await fetch('/data/encryptedSettings.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load repository settings:', error);
    return {
      github_token: "",
      admin_password: "",
      master_password_hash: "",
      password_hint: ""
    };
  }
}

// Function to save encrypted settings to the repository
export async function saveRepoSettings(
  settings: typeof encryptedSettings, 
  githubToken: string
): Promise<boolean> {
  try {
    // Generate file content
    const fileContent = JSON.stringify(settings, null, 2);
    
    // Commit the updated settings to the repository
    await commitFile(
      githubToken,
      {
        path: 'src/data/encryptedSettings.json',
        content: fileContent,
        message: 'Update encrypted settings [automated]'
      }
    );
    
    return true;
  } catch (error) {
    console.error('Failed to save repository settings:', error);
    return false;
  }
}

// Update saveMasterPassword to also save to repo when a token is available
export async function saveMasterPasswordToRepo(
  password: string, 
  hint?: string, 
  githubToken?: string
): Promise<void> {
  // Save to localStorage as before
  saveMasterPassword(password, hint);
  
  // If we have a GitHub token, also save to repo
  if (githubToken) {
    const passwordHash = hashPassword(password);
    
    const settings = await loadRepoSettings();
    settings.master_password_hash = passwordHash;
    settings.password_hint = hint || '';
    
    await saveRepoSettings(settings, githubToken);
  }
}

// Function to encrypt and save data to both localStorage and repo
export async function encryptAndStoreDataToRepo(
  key: string, 
  data: string, 
  password: string,
  githubToken?: string
): Promise<void> {
  // Save to localStorage first
  encryptAndStoreData(key, data, password);
  
  // If we have a GitHub token, also save to repo
  if (githubToken) {
    const encrypted = encryptToken(data, password);
    
    const settings = await loadRepoSettings();
    settings[key] = encrypted;
    
    await saveRepoSettings(settings, githubToken);
  }
}
