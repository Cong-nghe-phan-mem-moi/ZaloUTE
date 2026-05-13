import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'

const profilePaths = new Set(['/profile', '/user/profile', '/admin/profile'])

function App() {
  const { pathname } = window.location

  if (pathname === '/') {
    window.history.replaceState(null, '', '/login')
    return <LoginPage />
  }

  if (pathname === '/login') {
    return <LoginPage />
  }

  if (profilePaths.has(pathname)) {
    return <ProfilePage />
  }

  return <LoginPage />
}

export default App
