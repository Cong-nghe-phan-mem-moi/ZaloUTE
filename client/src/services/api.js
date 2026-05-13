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
