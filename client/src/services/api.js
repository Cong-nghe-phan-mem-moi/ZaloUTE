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

export const registerAPI = {
	register: (fullName, email, password) =>
		api.post('/auth/register', { fullName, email, password }),
	verifyOTP: (email, otp) =>
		api.post('/auth/verify-otp', { email, otp }),
}

export default api