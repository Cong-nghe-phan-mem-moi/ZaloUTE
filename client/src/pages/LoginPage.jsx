import { useState } from 'react'
import { authAPI } from '../services/api'
import './LoginPage.css'

const getErrorMessage = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    'Unable to log in. Please try again.'
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
      <section className="login-shell" aria-label="ZaloUTE login">
        <div className="brand-panel">
          <div className="brand-lockup">
            <div className="brand-mark">z</div>
            <div>
              <h1>ZaloUTE</h1>
              <p>Connect with classmates and keep your campus life in one place.</p>
            </div>
          </div>
        </div>

        <div className="login-panel">
          <form className="login-card" onSubmit={handleSubmit}>
            <div className="login-card-header">
              <h2>Log in</h2>
              <p>Welcome back to ZaloUTE</p>
            </div>

            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <div className="input-shell">
              <span className="material-symbols-outlined">mail</span>
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
            </div>

            <label className="sr-only" htmlFor="password">
              Password
            </label>
            <div className="input-shell password-field">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {errorMessage ? (
              <p className="login-error" role="alert">
                <span className="material-symbols-outlined">error</span>
                {errorMessage}
              </p>
            ) : null}

            <button className="login-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>

            <a className="forgot-link" href="/forgot-password">
              Forgot password?
            </a>

            <div className="divider" aria-hidden="true" />

            <a className="create-button" href="/register">
              Create new account
            </a>
          </form>

          <p className="login-caption">
            <strong>ZaloUTE</strong> for students, lecturers, and campus communities.
          </p>
        </div>
      </section>

      <footer className="login-footer">
        <span>English</span>
        <span>Vietnamese</span>
        <span>Privacy</span>
        <span>Terms</span>
        <span>ZaloUTE 2026</span>
      </footer>
    </main>
  )
}

export default LoginPage
