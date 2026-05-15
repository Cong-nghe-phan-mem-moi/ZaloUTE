import axios from 'axios'

const api = axios.create({
	baseURL: '/api',
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const requestPasswordResetOtp = (email) =>
	api.post('/auth/forgot-password/request-otp', { email })

export const verifyPasswordResetOtp = (email, otp) =>
	api.post('/auth/forgot-password/verify-otp', { email, otp })

export const resetPassword = (newPassword, resetToken) =>
	api.post(
		'/auth/forgot-password/reset-password',
		{ newPassword, resetToken },
		{
			headers: resetToken
				? {
						Authorization: `Bearer ${resetToken}`,
					}
				: undefined,
		},
	)

export default api
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include token in every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const userAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
};


export default api;
