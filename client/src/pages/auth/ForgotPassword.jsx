import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import {
  clearStatus,
  requestResetOtp,
  resetState,
  setError,
  setField,
  submitResetPassword,
  verifyResetOtp,
} from '../../redux/slices/forgotPasswordSlice'

const steps = [
  { id: 'email', label: 'Enter email' },
  { id: 'otp', label: 'Verify OTP' },
  { id: 'reset', label: 'New password' },
]

const StepItem = ({ isActive, isComplete, label, index }) => (
  <div className="flex items-center gap-3">
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
        isComplete
          ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
          : isActive
            ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
            : 'border-slate-200 bg-white text-slate-400'
      }`}
    >
      {index + 1}
    </div>
    <div>
      <p
        className={`text-sm font-medium ${
          isActive || isComplete ? 'text-slate-900' : 'text-slate-500'
        }`}
      >
        {label}
      </p>
    </div>
  </div>
)

const AlertMessage = ({ type, message }) => {
  if (!message) return null

  const style =
    type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${style}`}>{message}</div>
  )
}

function ForgotPassword() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const {
    step,
    email,
    otp,
    newPassword,
    confirmPassword,
    resetToken,
    loading,
    error,
    message,
  } = useAppSelector((state) => state.forgotPassword)

  useEffect(() => {
    dispatch(clearStatus())
  }, [dispatch, step])

  const onChange = (field) => (event) =>
    dispatch(setField({ field, value: event.target.value }))

  const handleEmailSubmit = (event) => {
    event.preventDefault()
    if (!email.trim()) {
      dispatch(setError('Please enter your email to receive an OTP.'))
      return
    }
    dispatch(requestResetOtp(email))
  }

  const handleOtpSubmit = (event) => {
    event.preventDefault()
    if (!otp.trim()) {
      dispatch(setError('Please enter the OTP you received.'))
      return
    }
    dispatch(verifyResetOtp({ email, otp }))
  }

  const handleResetSubmit = (event) => {
    event.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      dispatch(setError('New password must be at least 8 characters.'))
      return
    }
    if (newPassword !== confirmPassword) {
      dispatch(setError('Password confirmation does not match.'))
      return
    }
    dispatch(submitResetPassword({ newPassword, resetToken }))
  }

  const handleRestart = () => dispatch(resetState())
  const handleLoginRedirect = () => navigate('/login')

  const currentStepIndex = steps.findIndex((item) => item.id === step)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Zalo UTE
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                Forgot password?
              </h1>
              <p className="text-base text-slate-600">
                Recover your account quickly with OTP verification and create a new password
                securely.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Progress</p>
                <span className="text-xs text-slate-400">
                  {step === 'email' && 'Step 1/3'}
                  {step === 'otp' && 'Step 2/3'}
                  {step === 'reset' && 'Step 3/3'}
                  {step === 'success' && 'Completed'}
                </span>
              </div>
              <div className="mt-4 space-y-4">
                {steps.map((stepItem, index) => (
                  <StepItem
                    key={stepItem.id}
                    index={index}
                    label={stepItem.label}
                    isActive={stepItem.id === step}
                    isComplete={index < currentStepIndex}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Security</p>
              <p className="mt-2 text-sm text-slate-500">
                The OTP is valid for 10 minutes. Your new password must include uppercase and lowercase letters,
                a number, and a special character.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {step === 'email' && 'Enter your email to receive an OTP'}
                  {step === 'otp' && 'Verify OTP'}
                  {step === 'reset' && 'Create a new password'}
                  {step === 'success' && 'Completed'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {step === 'email' &&
                    'The registered email will receive a verification OTP.'}
                  {step === 'otp' &&
                    'Check your inbox for the 6-digit OTP.'}
                  {step === 'reset' &&
                    'Set a strong new password to protect your account.'}
                  {step === 'success' &&
                    'Your password has been reset successfully. Please log in again to continue.'}
                </p>
              </div>

              <AlertMessage type="error" message={error} />
              <AlertMessage type="success" message={message} />

              {step === 'email' && (
                <form className="space-y-4" onSubmit={handleEmailSubmit}>
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={onChange('email')}
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form className="space-y-4" onSubmit={handleOtpSubmit}>
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      OTP code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={onChange('otp')}
                      placeholder="Enter OTP"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Email: <span className="text-slate-700">{email}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleEmailSubmit}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Resend OTP
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'reset' && (
                <form className="space-y-4" onSubmit={handleResetSubmit}>
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={onChange('newPassword')}
                      placeholder="Enter new password"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={onChange('confirmPassword')}
                      placeholder="Confirm new password"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Updating...' : 'Reset password'}
                  </button>
                </form>
              )}

              {step === 'success' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    {message || 'You can now log in with your new password.'}
                  </div>
                  <button
                    type="button"
                    onClick={handleLoginRedirect}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-slate-800"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
