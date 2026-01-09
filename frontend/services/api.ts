import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For mobile simulator: Use your computer's IP addressr
const API_BASE_URL = 'http://localhost:3000';

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
    if (Platform.OS === 'web') {
      localStorage.setItem('authToken', token);
    } else {
      await AsyncStorage.setItem('authToken', token); // Mobiele support
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

// Helper function to save student ID
export const saveStudentId = async (studentId: string) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('studentId', studentId);
    } else {
      await AsyncStorage.setItem('studentId', studentId); // Mobiele support
    }
  } catch (error) {
    console.error('Error saving student ID:', error);
  }
};

// Helper function to get student ID
export const getStudentId = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('studentId');
    } else {
      return await AsyncStorage.getItem('studentId'); // Mobiele support
    }
  } catch (error) {
    console.error('Error getting student ID:', error);
    return null;
  }
};

// Helper function to save client ID
export const saveClientId = async (clientId: string) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('clientId', clientId);
    } else {
      await AsyncStorage.setItem('clientId', clientId); // Mobiele support
    }
  } catch (error) {
    console.error('Error saving client ID:', error);
  }
};

// Helper function to get client ID
export const getClientId = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('clientId');
    } else {
      return await AsyncStorage.getItem('clientId'); // Mobiele support
    }
  } catch (error) {
    console.error('Error getting client ID:', error);
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
      body: JSON.stringify({ status: 'withdrawn' }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel application');
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

  // Upload avatar image for student
  async uploadAvatar(studentId: number, formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/avatar`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to upload avatar');
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
  // Get available jobs (optionally exclude those already applied by a student)
  async getAvailableJobs(status = 'open', limit = 50, studentId?: number) {
    try {
      let url = `${API_BASE_URL}/jobs/available?status=${status}&limit=${limit}`;
      if (studentId) {
        url += `&studentId=${studentId}`;
      }
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

  // Get jobs for a specific client
  async getClientJobs(clientId: string | number, status?: string) {
    try {
      let url = `${API_BASE_URL}/jobs/client/${clientId}`;
      if (status) url += `?status=${status}`;
      logRequest('GET', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Error]', response.status, errorText);
        throw new Error(`Failed to fetch client jobs: ${response.status}`);
      }
      
      const data = await response.json();
      const jobs = data.jobs || data;
      console.log('[API Success] Client jobs:', jobs?.length || 0, 'jobs');
      return jobs;
    } catch (error: any) {
      console.error('[API Exception]', error);
      throw new Error(error.message || 'Network error - is the backend running?');
    }
  },

  // Create a new job
  async createJob(jobData: {
    client_id: string;
    category_id: number;
    title: string;
    description?: string;
    hourly_or_fixed: 'hourly' | 'fixed';
    hourly_rate?: number | null;
    fixed_price?: number | null;
    start_time: string;
    end_time?: string;
  }) {
    try {
      const url = `${API_BASE_URL}/jobs`;
      logRequest('POST', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        // Try to surface the full response body for easier debugging (may be JSON or plain text)
        let text = '';
        try {
          text = await response.text();
        } catch (e) {
          text = `<unable to read response body: ${e}>`;
        }
        console.error(`[API Error] POST ${url} returned ${response.status}: ${text}`);
        // Attempt to parse JSON error if present
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.error || parsed.message || text || 'Failed to create job');
        } catch (e) {
          throw new Error(text || 'Failed to create job');
        }
      }

      const data = await response.json();
      console.log('[API Success] Job created:', data);
      return data;
    } catch (error: any) {
      console.error('[API Exception]', error);
      throw new Error(error.message || 'Failed to create job');
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

  // Get applicants for a specific job
  async getJobApplicants(jobId: number) {
    try {
      const url = `${API_BASE_URL}/jobs/${jobId}/applicants`;
      logRequest('GET', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Error]', response.status, errorText);
        throw new Error(`Failed to fetch applicants: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API Success] Applicants:', data.applicants?.length || 0, 'applicants');
      return data;
    } catch (error: any) {
      console.error('[API Exception]', error);
      throw new Error(error.message || 'Network error - is the backend running?');
    }
  },

  // Update application status (accept/reject)
  async updateApplicationStatus(jobId: number, applicationId: number, status: 'accepted' | 'rejected') {
    try {
      const url = `${API_BASE_URL}/jobs/${jobId}/applicants/${applicationId}`;
      logRequest('PATCH', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Error]', response.status, errorText);
        throw new Error(`Failed to update application: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API Success] Application updated:', data);
      return data;
    } catch (error: any) {
      console.error('[API Exception]', error);
      throw new Error(error.message || 'Failed to update application');
    }
  },
};

// Auth API
export const authAPI = {
  async login(email: string, password: string) {
    try {
      const url = `${API_BASE_URL}/auth/login`;
      logRequest('POST', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      console.log('[API Success] Login successful:', data);
      
      // Save student ID for future API calls
      if (data.user.role === 'student') {
        await saveStudentId(data.user.id.toString());
        // Clear any client ID to avoid mixups
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('clientId');
        }
      }

      // Save client ID when role is client
      if (data.user.role === 'client') {
        await saveClientId(data.user.id.toString());
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('studentId');
        }
      }
      
      return data;
    } catch (error: any) {
      console.error('[API Exception] Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  async registerStudent(data: { email: string; password: string; phone?: string; school_name?: string; field_of_study?: string; academic_year?: string }) {
    try {
      const url = `${API_BASE_URL}/auth/register/student`;
      logRequest('POST', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const result = await response.json();
      console.log('[API Success] Registration successful:', result);
      
      // Auto-login after registration
      await saveStudentId(result.user.id.toString());
      
      return result;
    } catch (error: any) {
      console.error('[API Exception] Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  async logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('studentId');
      localStorage.removeItem('clientId');
    }
  },
};

// Payment API Endpoints
export const paymentAPI = {
  // Connect Stripe account for a student (returns onboarding URL)
  async connectStudentAccount(student_id: number) {
    try {
      const url = `${API_BASE_URL}/payments/connect-account`;
      logRequest('POST', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to initiate Stripe onboarding');
      }
      const result = await response.json();
      return result; // { onboarding_url, stripe_account_id, ... }
    } catch (error: any) {
      console.error('[Payment API Exception] Connect account failed:', error);
      throw new Error(error.message || 'Stripe onboarding failed');
    }
  },

  // Create payment intent for a job
  async createPaymentIntent(data: {
    student_id: number;
    job_id: number;
    client_id: number;
    amount: number;
    currency?: string;
    description?: string;
  }) {
    try {
      const url = `${API_BASE_URL}/payments/create-payment-intent`;
      logRequest('POST', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Payment API Error]', response.status, errorText);
        throw new Error(`Failed to create payment intent: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Payment API Success]', result);
      return result;
    } catch (error: any) {
      console.error('[Payment API Exception]', error);
      throw new Error(error.message || 'Payment failed');
    }
  },

  // Request payment from client for a completed job
  async requestPayment(data: {
    job_id: number;
    client_id: number;
    student_id: number;
    amount: number;
    currency?: string;
  }) {
    try {
      const url = `${API_BASE_URL}/payments/request-payment`;
      logRequest('POST', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Payment API Error]', response.status, errorText);
        throw new Error(`Failed to request payment: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Payment API Success] Payment request created:', result);
      return result;
    } catch (error: any) {
      console.error('[Payment API Exception]', error);
      throw new Error(error.message || 'Failed to request payment');
    }
  },

  // Get payment status
  async getPaymentStatus(paymentIntentId: string) {
    try {
      const url = `${API_BASE_URL}/payments/payment/${paymentIntentId}`;
      logRequest('GET', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Payment API Error]', response.status, errorText);
        throw new Error(`Failed to get payment status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Payment API Success] Payment status:', result);
      return result;
    } catch (error: any) {
      console.error('[Payment Status Error]', error);
      throw error;
    }
  },
};

// Admin API
export const adminAPI = {
  async getPendingStudents() {
    const url = `${API_BASE_URL}/admin/students/pending`;
    logRequest('GET', url);
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load pending students');
    return data.students || data;
  },

  async getVerifiedStudents() {
    const url = `${API_BASE_URL}/admin/students/verified`;
    logRequest('GET', url);
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load verified students');
    return data.students || data;
  },

  async verifyStudent(id: number, status: 'verified' | 'rejected') {
    const url = `${API_BASE_URL}/admin/students/${id}/verify`;
    logRequest('PATCH', url);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update verification status');
    return data.student || data;
  },

  async getIncidents(status?: string) {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const url = `${API_BASE_URL}/incidents${query}`;
    logRequest('GET', url);
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load incidents');
    return data.incidents || data;
  },

  async createIncident(payload: {
    summary: string;
    description?: string | null;
    job_id?: number | null;
    application_id?: number | null;
    student_id?: number | null;
    client_id?: number | null;
    incident_type?: string;
  }) {
    const url = `${API_BASE_URL}/incidents`;
    logRequest('POST', url);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create incident');
    return data;
  },

  async updateIncidentStatus(id: number, status: string) {
    const url = `${API_BASE_URL}/incidents/${id}`;
    logRequest('PATCH', url);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update incident');
    return data;
  },
};
