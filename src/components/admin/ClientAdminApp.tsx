import React, { useState, useEffect } from 'react';
import AdminInterface from './AdminInterface';
import GitHubSetup from './GitHubSetup';
import TokenTester from './TokenTester';
import TokenDebug from './TokenDebug';
import TokenDecrypt from './TokenDecrypt';
import InitialSetup from './InitialSetup';
import { 
  isEncryptedToken, 
  getEncryptionSettings, 
  clearEncryptionSettings, 
  encryptToken, 
  decryptToken, 
  hashPassword, 
  verifyPassword, 
  getMasterPasswordSettings, 
  saveMasterPassword,
  encryptAndStoreData,
  getDecryptedData,
  STORAGE_KEYS,
  loadRepoSettings,
  saveRepoSettings
} from '../../utils/cryptoUtil';

import { getContentList, validateToken } from '../../utils/githubDirectService';

interface ClientAdminAppProps {
  albums: any[];
  photos: any[];
  snips: any[];
  playlists: any[];
}

// Default fallback password if env var isn't available
const DEFAULT_PASSWORD = 'admin123';
const TOKEN_EXPIRY_DAYS = 30;

const ClientAdminApp: React.FC<ClientAdminAppProps> = (props) => {
  // Move environment variable access inside the component to prevent build-time issues
  const [envVars, setEnvVars] = useState({
    password: DEFAULT_PASSWORD,
    token: ''
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [gitHubToken, setGitHubToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isTokenEncrypted, setIsTokenEncrypted] = useState(false);
  const [encryptedToken, setEncryptedToken] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(true);
  const [contentData, setContentData] = useState({
    albums: props.albums || [],
    photos: props.photos || [],
    snips: props.snips || [],
    playlists: props.playlists || []
  });

  // Load environment variables safely after component mount
  useEffect(() => {
    // Access environment variables only after component is mounted
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;

    // Check if we have a master password hash already set
    const masterPasswordHash = localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD_HASH);
    
    if (masterPasswordHash) {
      // We already have a master password set, ignore the env password
      setEnvVars({
        password: '', // We'll use the encrypted one instead
        token: envToken || ''
      });
    } else {
      // No master password yet, use env variables for initial setup
      setEnvVars({
        password: envPassword || DEFAULT_PASSWORD,
        token: envToken || ''
      });
    }
    
    // Try to load repo settings
    async function attemptLoadRepoSettings() {
      try {
        const settings = await loadRepoSettings();
        if (settings && settings.master_password_hash) {
          // We have repo settings, ensure we're in a state to prompt for master password
          if (!localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD_HASH)) {
            localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HASH, settings.master_password_hash);
          }
          if (settings.password_hint) {
            localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD_HINT, settings.password_hint);
          }
        }
      } catch (error) {
        console.log('Could not load repository settings:', error);
      }
    }
    
    attemptLoadRepoSettings();
  }, []);
  
  // Check for existing auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('admin_auth');
    const storedExpiryDate = localStorage.getItem('token_expiry');
    let tokenExpired = false;
    
    // Check if token has expired
    if (storedExpiryDate) {
      const expiryDate = new Date(storedExpiryDate);
      if (expiryDate < new Date()) {
        // Token expired, clear it
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('github_token');
        localStorage.removeItem('token_encrypted');
        localStorage.removeItem('token_expiry');
        tokenExpired = true;
      }
    }
    
    if (storedAuth && !tokenExpired) {
      // If we're using an encrypted admin password, we need to check if storedAuth is valid
      // For now, just set authenticated if we have auth data that hasn't expired
      setIsAuthenticated(true);
      
      // First try to get token from environment variable
      if (envVars.token) {
        setGitHubToken(envVars.token);
      } else {
        // Fall back to stored token
        const storedToken = localStorage.getItem('github_token');
        const tokenEncrypted = localStorage.getItem('token_encrypted') === 'true';
        
        if (storedToken) {
          if (tokenEncrypted) {
            // If token is encrypted, don't set it yet - we'll need to decrypt it
            setIsTokenEncrypted(true);
            setEncryptedToken(storedToken);
          } else {
            // Token is not encrypted, use it directly
            setGitHubToken(storedToken);
          }
        }
      }
    }
    
    setLoading(false);
  }, [envVars]);

  // Check if initial setup is complete
  useEffect(() => {
    async function checkSetup() {
      try {
        // First check if repository settings exist
        const repoSettings = await loadRepoSettings();
        
        if (repoSettings && repoSettings.master_password_hash) {
          // We have repository settings
          if (!localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE)) {
            // Local setup is not complete, but we have repo settings
            // Show the setup screen that will ask for the master password
            setIsSetupComplete(false);
          }
        } else {
          // No repo settings, check local storage
          const setupComplete = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE) === 'true';
          setIsSetupComplete(setupComplete);
        }
      } catch (e) {
        console.error('Failed to check repo settings:', e);
        // If we can't access repo settings, fall back to local storage
        const setupComplete = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE) === 'true';
        setIsSetupComplete(setupComplete);
      }
      
      setLoading(false);
    }
    
    checkSetup();
  }, []);

  // Fetch content from GitHub when token becomes available
  useEffect(() => {
    const fetchLiveContent = async () => {
      if (!gitHubToken) return;
      
      setLoading(true);
      
      try {
        // Make direct GitHub API calls to fetch content
        const fetchTypes = ['albums', 'photos', 'snips', 'playlists'];
        const newData = { ...contentData };
        
        // Fetch each content type in parallel
        const results = await Promise.all(
          fetchTypes.map(type => getContentList(gitHubToken, type))
        );
        
        // Process results
        results.forEach((result, index) => {
          const type = fetchTypes[index] as keyof typeof contentData;
          
          if (result.success && result.items) {
            newData[type] = result.items;
          }
        });
        
        setContentData(newData);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLiveContent();
  }, [gitHubToken]);

  // Debug the token value
  useEffect(() => {
    if (gitHubToken) {
      console.log(
        "Using GitHub token:", 
        gitHubToken.substring(0, 4) + '...' + gitHubToken.substring(gitHubToken.length - 4)
      );
    }
  }, [gitHubToken]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the master password hash
    const settings = getMasterPasswordSettings();
    
    if (settings.passwordHash) {
      // Verify against master password hash
      if (verifyPassword(password, settings.passwordHash)) {
        loginSuccess();
        
        // Try to get decrypted GitHub token
        const decryptedToken = getDecryptedData('github_token', password);
        if (decryptedToken) {
          setGitHubToken(decryptedToken);
          setIsTokenEncrypted(false);
          setEncryptedToken(null);
        } else if (envVars.token) {
          // Encrypt and store the environment token
          encryptAndStoreData('github_token', envVars.token, password);
          setGitHubToken(envVars.token);
        }
      } else {
        setLoginError('Incorrect password');
        setTimeout(() => setLoginError(''), 3000);
      }
    } else if (password === envVars.password) {
      // First-time login with the default/environment password
      loginSuccess();
      
      // Setup the master password system with this password
      saveMasterPassword(password);
      
      // Encrypt the default admin password with this password
      encryptAndStoreData('admin_password', envVars.password, password);
      
      // If we have a token from environment, also encrypt it
      if (envVars.token) {
        encryptAndStoreData('github_token', envVars.token, password);
        setGitHubToken(envVars.token);
      }
      
      // Try to save settings to repository if we have a token
      if (envVars.token) {
        saveSettingsToRepository(password, envVars.token);
      }
    } else {
      setLoginError('Incorrect password');
      setTimeout(() => setLoginError(''), 3000);
    }
  };
  
  // Helper function to handle successful login
  const loginSuccess = () => {
    // Set auth data with expiration
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
    
    localStorage.setItem('admin_auth', 'authenticated'); // Store a flag instead of password
    localStorage.setItem('token_expiry', expiryDate.toISOString());
    
    setIsAuthenticated(true);
    setLoginError('');
    
    // If we have an environment token, use it immediately
    if (envVars.token) {
      setGitHubToken(envVars.token);
    }
  };

  // Save settings to repository for cross-device access
  const saveSettingsToRepository = async (masterPassword: string, token: string) => {
    try {
      // First validate that the token works
      const validation = await validateToken(token);
      if (!validation.valid) {
        console.error('Cannot save settings to repo: Invalid token');
        return;
      }
      
      // Get the hash of the master password
      const passwordHash = hashPassword(masterPassword);
      const settings = getMasterPasswordSettings();
      
      // Prepare settings object - only include what's needed
      const repoSettings = {
        github_token: encryptToken(token, masterPassword),
        master_password_hash: passwordHash,
        password_hint: settings.hint || ''
      };
      
      // Save to repository
      await saveRepoSettings(repoSettings, token);
      console.log('Settings saved to repository');
    } catch (error) {
      console.error('Failed to save settings to repository:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    
    // Don't remove these on logout:
    // - token credentials (for convenience)
    // - setup status (to avoid re-setup)
    
    setIsAuthenticated(false);
    setGitHubToken(null);
  };

  const saveGitHubToken = (token: string, encrypted: boolean = false) => {
    // Store token in localStorage for persistence
    localStorage.setItem('github_token', token);
    localStorage.setItem('token_encrypted', encrypted.toString());
    
    if (encrypted) {
      // Token is encrypted, set state accordingly
      setIsTokenEncrypted(true);
      setEncryptedToken(token);
    } else {
      // Token is not encrypted, use directly
      setGitHubToken(token);
      setIsTokenEncrypted(false);
      setEncryptedToken(null);
      
      // Also save encrypted version for next time if we have a master password
      const settings = getMasterPasswordSettings();
      if (settings.passwordHash) {
        // Try to get the master password from session if available
        const masterPassword = sessionStorage.getItem('master_password');
        if (masterPassword) {
          encryptAndStoreData('github_token', token, masterPassword);
          
          // Save settings to repository if possible
          saveSettingsToRepository(masterPassword, token);
        }
      }
    }
  };
  
  const handleTokenDecrypted = (decryptedToken: string) => {
    // Set the active token
    setGitHubToken(decryptedToken);
    setIsTokenEncrypted(false);
    setEncryptedToken(null);
  };

  const handleSetupComplete = (newPassword: string) => {
    setIsSetupComplete(true);
    
    // Auto login after setup
    setPassword(newPassword); // Set the password they just created
    
    // Set auth data with expiration
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
    
    localStorage.setItem('admin_auth', 'authenticated');
    localStorage.setItem('token_expiry', expiryDate.toISOString());
    localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');
    
    setIsAuthenticated(true);
    
    // Store password temporarily in session storage for token encryption
    sessionStorage.setItem('master_password', newPassword);
    
    // Try to get decrypted GitHub token if it exists in repository settings
    const handleRepoToken = async () => {
      try {
        const repoSettings = await loadRepoSettings();
        if (repoSettings && repoSettings.github_token) {
          try {
            const decryptedToken = decryptToken(repoSettings.github_token, newPassword);
            if (decryptedToken && (decryptedToken.startsWith('ghp_') || decryptedToken.startsWith('github_'))) {
              // Successfully decrypted token from repo settings
              setGitHubToken(decryptedToken);
              
              // Also store in local storage
              encryptAndStoreData('github_token', decryptedToken, newPassword);
            }
          } catch (e) {
            console.error('Failed to decrypt repository token:', e);
          }
        }
      } catch (e) {
        console.error('Failed to load repository settings:', e);
      }
    };
    
    handleRepoToken();
  };

  // Inactivity timeout setup (auto logout after 2 hours of inactivity)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let inactivityTimer: number;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
      }
      
      // Auto logout after 2 hours of inactivity
      inactivityTimer = window.setTimeout(() => {
        handleLogout();
        alert('You have been logged out due to inactivity');
      }, 2 * 60 * 60 * 1000);
    };
    
    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
    
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isAuthenticated]);

  // Fix loading screen div structure
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show initial setup screen if needed
  if (!isSetupComplete) {
    return (
      <InitialSetup 
        defaultAdminPassword={envVars.password || DEFAULT_PASSWORD} 
        onSetupComplete={handleSetupComplete}
        envToken={envVars.token}
      />
    );
  }

  // Fix login screen div structure
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Brain Admin Login</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Master Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              {/* Display password hint if available */}
              {getMasterPasswordSettings().hint && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="font-semibold">Password hint:</span> {getMasterPasswordSettings().hint}
                </div>
              )}
            </div>
            {loginError && (
              <div className="text-red-600 text-sm">{loginError}</div>
            )}
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Log in
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show decryption screen if token is encrypted
  if (isAuthenticated && isTokenEncrypted && encryptedToken) {
    return <TokenDecrypt encryptedToken={encryptedToken} onDecrypt={handleTokenDecrypted} />;
  }

  // Skip GitHub setup if token is available from environment or has been decrypted
  if (isAuthenticated && !gitHubToken) {
    return <GitHubSetup onTokenSave={saveGitHubToken} />;
  }

  // Fix main return structure at the bottom
  return (
    <div className="container mx-auto px-4">
      <div className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-sm text-green-600 mb-2">
            Using GitHub token: {envVars.token ? 'From environment' : 'From browser storage'}
          </div>
          {/* Token testing components */}
          <TokenTester token={gitHubToken || ''} />
        </div>
        
        <button 
          onClick={handleLogout} 
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </button>
      </div>
      
      <AdminInterface 
        albums={contentData.albums} 
        photos={contentData.photos} 
        snips={contentData.snips} 
        playlists={contentData.playlists} 
        gitHubToken={gitHubToken || ''} 
      />
    </div>
  );
};

export default ClientAdminApp;
