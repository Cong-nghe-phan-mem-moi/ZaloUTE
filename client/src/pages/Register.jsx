import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  clearStatus,
  setError,
  setField,
  resetState,
  submitRegister,
  submitVerifyOtp,
} from '../store/slices/registerSlice'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

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

function Register() {
  const dispatch = useAppDispatch()
  const {
    step,
    fullName,
    email,
    password,
    confirmPassword,
    otp,
    loading,
    error,
    message,
  } = useAppSelector((state) => state.register)

  useEffect(() => {
    dispatch(clearStatus())
  }, [dispatch, step])

  const onChange = (field) => (event) =>
    dispatch(setField({ field, value: event.target.value }))

  const handleRegisterSubmit = (event) => {
    event.preventDefault()

    const normalizedFullName = fullName.trim()
    const normalizedEmail = email.trim()

    if (!normalizedFullName) {
      dispatch(setError('Họ tên là bắt buộc'))
      return
    }

    if (normalizedFullName.length < 2 || normalizedFullName.length > 50) {
      dispatch(setError('Họ tên phải từ 2 đến 50 ký tự'))
      return
    }

    if (!normalizedEmail) {
      dispatch(setError('Email là bắt buộc'))
      return
    }

    if (!emailRegex.test(normalizedEmail)) {
      dispatch(setError('Email không hợp lệ'))
      return
    }

    if (!password) {
      dispatch(setError('Mật khẩu là bắt buộc'))
      return
    }

    if (!strongPasswordRegex.test(password)) {
      dispatch(
        setError(
          'Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt',
        ),
      )
      return
    }

    if (!confirmPassword) {
      dispatch(setError('Xác nhận mật khẩu là bắt buộc'))
      return
    }

    if (password !== confirmPassword) {
      dispatch(setError('Mật khẩu nhập lại chưa khớp'))
      return
    }

    dispatch(submitRegister({ fullName: normalizedFullName, email: normalizedEmail, password }))
  }

  const handleOtpSubmit = (event) => {
    event.preventDefault()

    if (!otp.trim()) {
      dispatch(setError('Vui lòng nhập mã OTP'))
      return
    }

    if (otp.length !== 6) {
      dispatch(setError('OTP phải có 6 chữ số'))
      return
    }

    dispatch(submitVerifyOtp({ email, otp }))
  }

  const handleRestart = () => dispatch(resetState())

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="space-y-6">
            <div className="flex justify-start">
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span aria-hidden="true">&lt;</span>
                Quay về đăng nhập
              </a>
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {step === 'register' && 'Đăng ký tài khoản'}
                {step === 'verify-otp' && 'Xác thực OTP'}
                {step === 'success' && 'Đăng ký thành công'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {step === 'register' &&
                  'Tạo tài khoản mới để bắt đầu sử dụng Zalo UTE'}
                {step === 'verify-otp' &&
                  'Nhập mã OTP được gửi đến email của bạn'}
                {step === 'success' &&
                  'Tài khoản của bạn đã được tạo thành công'}
              </p>
            </div>

            <AlertMessage type="error" message={error} />
            <AlertMessage type="success" message={message} />

            {step === 'register' && (
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={onChange('fullName')}
                    placeholder="Nhập họ tên"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

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
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={onChange('password')}
                    placeholder="Nhập mật khẩu"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={onChange('confirmPassword')}
                    placeholder="Nhập lại mật khẩu"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </form>
            )}

            {step === 'verify-otp' && (
              <form className="space-y-4" onSubmit={handleOtpSubmit}>
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Mã OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={onChange('otp')}
                    placeholder="Nhập mã OTP"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Email: <span className="text-slate-700">{email}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Đang xác thực...' : 'Xác thực'}
                </button>
              </form>
            )}

            {step === 'success' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                  {message ||
                    'Tài khoản của bạn đã được tạo thành công. Hãy đăng nhập để tiếp tục.'}
                </div>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-slate-800"
                >
                  Quay lại đầu
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
