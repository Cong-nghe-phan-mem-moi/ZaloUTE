import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  clearStatus,
  setError,
  setField,
  resetState,
  submitVerifyOtp,
} from '../store/slices/registerSlice'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const otpRegex = /^\d{6}$/

const AlertMessage = ({ type, message }) => {
  if (!message) return null

  const style =
    type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${style}`}>
      {message}
    </div>
  )
}

export default function VerifyOtp() {
  const dispatch = useAppDispatch()
  const { email, otp, loading, error, message } = useAppSelector(
    (state) => state.register,
  )

  useEffect(() => {
    dispatch(clearStatus())
  }, [dispatch])

  const onChange = (field) => (event) =>
    dispatch(setField({ field, value: event.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedEmail = email.trim()
    const normalizedOtp = otp.trim()

    if (!normalizedEmail) {
      dispatch(setError('Email is required'))
      return
    }

    if (!emailRegex.test(normalizedEmail)) {
      dispatch(setError('Invalid email'))
      return
    }

    if (!normalizedOtp) {
      dispatch(setError('OTP is required'))
      return
    }

    if (!otpRegex.test(normalizedOtp)) {
      dispatch(setError('OTP must be 6 digits'))
      return
    }

    dispatch(submitVerifyOtp({ email: normalizedEmail, otp: normalizedOtp }))
  }

  const handleRestart = () => dispatch(resetState())

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Verify OTP
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter the OTP sent to your email
              </p>
            </div>

            <AlertMessage type="error" message={error} />
            <AlertMessage type="success" message={message} />

            <form className="space-y-4" onSubmit={handleSubmit}>
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

              <div>
                <label className="text-xs font-medium text-slate-500">
                  OTP code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={onChange('otp')}
                  placeholder="Enter the 6-digit OTP"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  maxLength="6"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-slate-800"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
