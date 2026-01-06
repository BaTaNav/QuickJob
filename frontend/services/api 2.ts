import { Platform } from 'react-native';

// API Service for QuickJob Backend
// For web: http://localhost:3000
// For mobile simulator: Use your computer's IP address (e.g., http://192.168.1.x:3000)
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://192.168.129.7:3000';

// Add logging for debugging
const logRequest = (method: string, url: string) => {
  console.log(`[API] ${method} ${url}`);
};

// Helper function to get auth token from storage
const getAuthToken = async () => {
  try {
    // In a real app, you'd get this from AsyncStorage or SecureStore
    // For now, we'll use a placeholder
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('authToken');
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to save auth token
export const saveAuthToken = async (token: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('authToken', token);
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

// Helper function to save student ID
export const saveStudentId = async (studentId: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('studentId', studentId);
    }
  } catch (error) {
    console.error('Error saving student ID:', error);
  }
};

// Helper function to get student ID
export const getStudentId = async () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('studentId');
    }
    return null;
  } catch (error) {
    console.error('Error getting student ID:', error);
    return null;
  }
};

// Student API Endpoints
export const studentAPI = {
  // Get student dashboard
  async getDashboard(studentId: number) {
    try {
      const url = `${API_BASE_URL}/students/${studentId}/dashboard`;
      logRequest('GET', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Error]', response.status, errorText);
        throw new Error(`Failed to fetch dashboard: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[API Success] Dashboard data:', data);
      return data;
    } catch (error: any) {
      console.error('[API Exception]', error);
      throw new Error(error.message || 'Network error - is the backend running?');
    }
  },

  // Get student profile
  async getProfile(studentId: number) {
    try {
      const url = `${API_BASE_URL}/students/${studentId}/profile`;
      logRequest('GET', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Error]', response.status, errorText);
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API Success] Profile data:', data);
      return data;
    } catch (error: any) {
      console.error('[API Exception]', error);
      throw new Error(error.message || 'Network error - is the backend running?');
    }
  },

  // Update student profile
  async updateProfile(studentId: number, data: any) {
    const token = await getAuthToken();
    // Only send fields that exist in database
    const allowedFields = ['phone', 'school_name', 'field_of_study', 'academic_year', 'radius_km'];
    const filteredData = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => { obj[key] = data[key]; return obj; }, {});
    
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(filteredData),
    });
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    return response.json();
  },

  // Apply for a job
  async applyForJob(studentId: number, jobId: number, coverLetter?: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ job_id: jobId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to apply for job');
    }
    return response.json();
  },

  // Get all applications
  async getApplications(studentId: number) {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/applications`);
    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }
    const data = await response.json();
    // Backend now returns {applications: [], message: string, count: number}
    return data.applications || data;
  },

  // Cancel an application
  async cancelApplication(studentId: number, applicationId: number) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (!response.ok) {
      throw new Error('Failed to cancel application');
    }
    return response.json();
  },

  // Get student documents
  async getDocuments(studentId: number) {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/documents`);
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    const data = await response.json();
    // Backend now returns {documents: [], message: string, count: number}
    return data.documents || data;
  },

  // Upload document
  async uploadDocument(studentId: number, documentType: string, fileUrl: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ document_type: documentType, file_url: fileUrl }),
    });
    if (!response.ok) {
      throw new Error('Failed to upload document');
    }
    return response.json();
  },

  // Get student reviews
  async getReviews(studentId: number) {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/reviews`);
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    const data = await response.json();
    // Backend now returns {reviews: [], message: string, count: number, avg_rating: number}
    return data.reviews || data;
  },
};

// Jobs API Endpoints
export const jobsAPI = {
  // Get available jobs
  async getAvailableJobs(status = 'open', limit = 50) {
    try {
      const url = `${API_BASE_URL}/jobs/available?status=${status}&limit=${limit}`;
      logRequest('GET', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Error]', response.status, errorText);
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const data = await response.json();
      // Backend now returns {jobs: [], message: string, count: number}
      const jobs = data.jobs || data; // Handle both formats
      console.log('[API Success] Jobs data:', jobs?.length || 0, 'jobs');
      return jobs;
    } catch (error: any) {
      console.error('[API Exception]', error);
      throw new Error(error.message || 'Network error - is the backend running?');
    }
  },

  // Get specific job
  async getJob(jobId: number) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch job');
    }
    return response.json();
  },

  // Search jobs
  async searchJobs(query?: string, location?: string, category?: number) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    if (category) params.append('category', category.toString());
    
    const response = await fetch(`${API_BASE_URL}/jobs/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to search jobs');
    }
    const data = await response.json();
    // Backend now returns {jobs: [], message: string, count: number}
    return data.jobs || data;
  },
};

// Auth API (placeholder - implement with your auth provider)
export const authAPI = {
  async login(email: string, password: string) {
    // This should connect to your authentication backend
    // For now, return mock data
    return {
      token: 'mock_token',
      user: {
        id: 1,
        email,
        role: 'student',
      },
    };
  },

  async signup(data: any) {
    // This should connect to your authentication backend
    // For now, return mock data
    return {
      token: 'mock_token',
      user: {
        id: 1,
        email: data.email,
        role: 'student',
      },
    };
  },

  async logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('studentId');
    }
  },
};
