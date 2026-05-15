import { useState } from 'react'
import { authAPI } from '../services/api'
import './LoginPage.css'

const getErrorMessage = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    'Không thể đăng nhập. Vui lòng thử lại.'
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await authAPI.login({
        email: email.trim(),
        password,
      })
      const { token, redirectUrl } = response.data.data

      localStorage.setItem('token', token)
      window.location.assign(redirectUrl || '/profile')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Đăng nhập ZaloUTE">
        <div className="brand-panel">
          <h1>ZaloUTE</h1>
          <p>Kết nối sinh viên UTE, trò chuyện và cập nhật mọi hoạt động trong một nơi.</p>
        </div>

        <div className="login-panel">
          <form className="login-card" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label className="sr-only" htmlFor="password">
              Mật khẩu
            </label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>

            {errorMessage ? (
              <p className="login-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button className="login-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <a className="forgot-link" href="/forgot-password">
              Quên mật khẩu?
            </a>

            <div className="divider" aria-hidden="true" />

            <a className="create-button" href="/register">
              Tạo tài khoản mới
            </a>
          </form>

          <p className="login-caption">
            <strong>ZaloUTE</strong> dành cho cộng đồng sinh viên và giảng viên.
          </p>
        </div>
      </section>

      <footer className="login-footer">
        <span>Tiếng Việt</span>
        <span>English</span>
        <span>Quyền riêng tư</span>
        <span>Điều khoản</span>
        <span>ZaloUTE 2026</span>
      </footer>
    </main>
  )
}

export default LoginPage
