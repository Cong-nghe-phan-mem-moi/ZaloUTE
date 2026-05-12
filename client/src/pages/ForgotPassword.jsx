import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  clearStatus,
  requestResetOtp,
  resetState,
  setError,
  setField,
  submitResetPassword,
  verifyResetOtp,
} from '../store/slices/forgotPasswordSlice'

const steps = [
  { id: 'email', label: 'Nhập email' },
  { id: 'otp', label: 'Xác thực OTP' },
  { id: 'reset', label: 'Mật khẩu mới' },
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
      dispatch(setError('Vui lòng nhập email để nhận OTP.'))
      return
    }
    dispatch(requestResetOtp(email))
  }

  const handleOtpSubmit = (event) => {
    event.preventDefault()
    if (!otp.trim()) {
      dispatch(setError('Vui lòng nhập mã OTP đã nhận.'))
      return
    }
    dispatch(verifyResetOtp({ email, otp }))
  }

  const handleResetSubmit = (event) => {
    event.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      dispatch(setError('Mật khẩu mới phải có ít nhất 8 ký tự.'))
      return
    }
    if (newPassword !== confirmPassword) {
      dispatch(setError('Mật khẩu nhập lại chưa khớp.'))
      return
    }
    dispatch(submitResetPassword({ newPassword, resetToken }))
  }

  const handleRestart = () => dispatch(resetState())

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
                Quên mật khẩu?
              </h1>
              <p className="text-base text-slate-600">
                Lấy lại tài khoản nhanh chóng bằng OTP xác thực và tạo mật khẩu mới
                an toàn.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Tiến trình</p>
                <span className="text-xs text-slate-400">
                  {step === 'email' && 'Bước 1/3'}
                  {step === 'otp' && 'Bước 2/3'}
                  {step === 'reset' && 'Bước 3/3'}
                  {step === 'success' && 'Hoàn tất'}
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
              <p className="text-sm font-semibold text-slate-800">Bảo mật</p>
              <p className="mt-2 text-sm text-slate-500">
                OTP có hiệu lực trong 10 phút. Mật khẩu mới cần có chữ hoa, chữ
                thường, số và ký tự đặc biệt.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {step === 'email' && 'Nhập email để nhận OTP'}
                  {step === 'otp' && 'Xác thực OTP'}
                  {step === 'reset' && 'Tạo mật khẩu mới'}
                  {step === 'success' && 'Hoàn tất'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {step === 'email' &&
                    'Email đã đăng ký sẽ nhận mã OTP xác thực.'}
                  {step === 'otp' &&
                    'Kiểm tra hộp thư để lấy mã OTP gồm 6 chữ số.'}
                  {step === 'reset' &&
                    'Thiết lập mật khẩu mới mạnh để bảo vệ tài khoản.'}
                  {step === 'success' &&
                    'Bạn đã đặt lại mật khẩu thành công. Hãy đăng nhập lại để tiếp tục.'}
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
                    {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
                  </button>
                </form>
              )}

              {step === 'otp' && (
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
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleEmailSubmit}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Gửi lại OTP
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Đang xác thực...' : 'Xác thực'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'reset' && (
                <form className="space-y-4" onSubmit={handleResetSubmit}>
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={onChange('newPassword')}
                      placeholder="Nhập mật khẩu mới"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Nhập lại mật khẩu
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={onChange('confirmPassword')}
                      placeholder="Nhập lại mật khẩu mới"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              )}

              {step === 'success' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    {message || 'Bạn có thể đăng nhập bằng mật khẩu mới.'}
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
          </section>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
