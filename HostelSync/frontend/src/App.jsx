import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Mess from './pages/Mess.jsx'
import Transport from './pages/Transport.jsx'
import Water from './pages/Water.jsx'
import Cleaning from './pages/Cleaning.jsx'
import Network from './pages/Network.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes with layout */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mess" element={<Mess />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/water" element={<Water />} />
        <Route path="/cleaning" element={<Cleaning />} />
        <Route path="/network" element={<Network />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
