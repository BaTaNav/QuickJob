import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';

const API_BASE_URL = ENV.API_BASE_URL;

/**
 * Retrieves the authentication token from storage
 * Uses localStorage for web and AsyncStorage for mobile
 */
const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return await AsyncStorage.getItem('authToken');
};

/**
 * Uploads a single image to the backend
 * @param uri - Image URI (file:// for mobile, http(s):// or data: for web)
 * @param folder - Optional folder name for organizing uploads
 * @returns Promise resolving to the public URL of the uploaded image
 * @throws Error if upload fails or auth token is unavailable
 */
export const uploadImage = async (
  uri: string,
  folder?: string
): Promise<string> => {
  try {
    // Auth token is optional (uploads during registration may not have one yet)
    const authToken = await getAuthToken();

    const formData = new FormData();

    // Handle platform-specific file appending
    if (Platform.OS === 'web') {
      // For web: fetch blob from URI and append
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URI: ${response.statusText}`);
      }
      const blob = await response.blob();
      formData.append('file', blob, `upload-${Date.now()}.jpg`);
    } else {
      // For mobile: append URI directly (React Native handles file:// URIs in FormData)
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: `upload-${Date.now()}.jpg`,
      } as any);
    }

    // Construct upload URL with optional folder parameter
    const uploadUrl = folder
      ? `${API_BASE_URL}/uploads?folder=${encodeURIComponent(folder)}`
      : `${API_BASE_URL}/uploads`;

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Upload failed with status ${uploadResponse.status}: ${errorText}`
      );
    }

    const data = await uploadResponse.json();

    if (!data.url) {
      throw new Error('No URL returned from server');
    }

    return data.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Image upload failed: ${message}`);
  }
};

/**
 * Uploads multiple images to the backend
 * @param uris - Array of image URIs
 * @param folder - Optional folder name for organizing uploads
 * @returns Promise resolving to an array of public URLs for the uploaded images
 * @throws Error if any upload fails or auth token is unavailable
 */
export const uploadMultipleImages = async (
  uris: string[],
  folder?: string
): Promise<string[]> => {
  try {
    if (!uris || uris.length === 0) {
      throw new Error('No image URIs provided');
    }

    const uploadPromises = uris.map((uri) => uploadImage(uri, folder));
    const urls = await Promise.all(uploadPromises);

    return urls;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Multiple image upload failed: ${message}`);
  }
};
