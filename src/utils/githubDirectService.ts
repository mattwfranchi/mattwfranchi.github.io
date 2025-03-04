/**
 * Client-side GitHub API interactions for content management
 */

import { optimizeImage } from './imageProcessing';

interface GithubFile {
  path: string;
  content: string;
  message: string;
  branch?: string;
}

interface ContentItem {
  id: string;
  title?: string;
  date?: string;
  [key: string]: any;
}

// Constants
const REPO_OWNER = 'mattwfranchi';
const REPO_NAME = 'mattwfranchi.github.io';
const DEFAULT_BRANCH = 'main';

/**
 * Get repository information for a file
 */
export async function getFileInfo(token: string, path: string): Promise<any> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // File doesn't exist
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get file info:', error);
    throw error;
  }
}

/**
 * Commit a file to the repository
 */
export async function commitFile(token: string, file: GithubFile): Promise<any> {
  const { path, content, message, branch = DEFAULT_BRANCH } = file;
  
  try {
    // First check if the file exists
    const existingFile = await getFileInfo(token, path).catch(() => null);
    
    // Prepare the request body
    const requestBody: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch
    };
    
    // If file exists, include the SHA
    if (existingFile && existingFile.sha) {
      requestBody.sha = existingFile.sha;
    }
    
    // Make the API request to create or update the file
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to commit file:', error);
    throw error;
  }
}

/**
 * Create a new content item in the repository
 */
export async function createContent(
  type: string, 
  data: ContentItem, 
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Ensure we have an ID
    if (!data.id) {
      data.id = `${Date.now()}`; // Use timestamp as ID if none provided
    }
    
    // Format the date if provided
    if (data.date && typeof data.date === 'object' && 'toISOString' in data.date) {
      data.date = (data.date as Date).toISOString();
    }
    
    // Generate content
    const content = JSON.stringify(data, null, 2);
    
    // Create filename
    const filename = `${data.id}.json`;
    
    // Define path in repository
    const path = `src/content/${type}/${filename}`;
    
    // Generate commit message
    const message = `Add new ${type.slice(0, -1)}: ${data.title || data.id}`;
    
    // Commit the file to GitHub
    await commitFile(token, {
      path,
      content,
      message
    });
    
    return { 
      success: true, 
      message: `Successfully created ${type.slice(0, -1)}: ${data.title || data.id}`
    };
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload an image to the repository
 */
export async function uploadImage(
  file: File, 
  albumId: string,
  token: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Optimize image client-side before uploading
    const optimizedFile = await optimizeImage(file);
    
    // Generate a slug-friendly filename
    const filename = file.name.toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Create path for the image in the repository
    const imagePath = `public/assets/photos/${albumId}/${filename}`;
    
    // Read file as binary data
    const reader = new FileReader();
    const fileData = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsBinaryString(optimizedFile);
    });
    
    // Commit the image file to the repository
    await commitFile(token, {
      path: imagePath,
      content: fileData,
      message: `Upload image: ${filename} to album ${albumId}`
    });
    
    // Return the URL to the image (relative to the public directory)
    const imageUrl = `/assets/photos/${albumId}/${filename}`;
    return {
      success: true,
      url: imageUrl
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error uploading image'
    };
  }
}

// Helper function to convert a file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Fetch content list from the repository
 */
export async function getContentList(
  token: string, 
  type: string
): Promise<{ success: boolean; items?: any[]; error?: string }> {
  try {
    if (!token || token.trim() === '') {
      console.error("No GitHub token provided to getContentList");
      return { success: false, error: "No GitHub token provided" };
    }
    
    console.log(`Fetching ${type} list with token: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
    
    // Get the list of files in the content directory
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/src/content/${type}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Directory src/content/${type} doesn't exist yet, returning empty array`);
        return { success: true, items: [] }; // Directory doesn't exist yet
      }
      
      console.error(`GitHub API error when fetching content list: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Response body:", errorBody);
      
      // Special handling for 401 errors
      if (response.status === 401) {
        console.error("Token authentication failed (401). Token may be invalid or expired.");
        return { 
          success: false, 
          error: "Authentication failed. Your GitHub token may be invalid or expired."
        };
      }
      
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const files = await response.json();
    console.log(`Found ${files.length} files in ${type} directory`);
    
    // Only process JSON files
    const jsonFiles = files.filter((file: any) => 
      file.name.endsWith('.json') && file.type === 'file'
    );
    console.log(`Processing ${jsonFiles.length} JSON files`);
    
    // Fetch and parse each file
    const items = await Promise.all(
      jsonFiles.map(async (file: any) => {
        const contentResponse = await fetch(file.download_url);
        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch content: ${contentResponse.status}`);
        }
        return await contentResponse.json();
      })
    );
    
    return { success: true, items };
  } catch (error) {
    console.error(`Failed to get ${type} list:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Validate GitHub token without server
export async function validateToken(token: string): Promise<{valid: boolean; message?: string}> {
  try {
    // First, do a simple request to verify basic authentication
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      console.log("Token validation failed on user endpoint:", userResponse.status);
      return { valid: false, message: `Authentication failed: ${userResponse.statusText}` };
    }

    const userData = await userResponse.json();
    
    // Now verify repository access with a less intrusive call (just checking repo existence)
    const repoResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!repoResponse.ok) {
      console.log("Token validation failed on repo endpoint:", repoResponse.status);
      return { 
        valid: false, 
        message: `Token doesn't have access to the repository: ${repoResponse.statusText}` 
      };
    }
    
    // Additional debug logging for successful validation
    console.log(`Token validated successfully as ${userData.login}`);
    return { valid: true, message: `Authenticated as ${userData.login}` };
  } catch (error) {
    console.error('Error validating token:', error);
    return { 
      valid: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}