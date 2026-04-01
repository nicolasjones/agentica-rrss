import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useActiveProject } from './context/ActiveProjectContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProjectsOverview from './pages/ProjectsOverview';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import CreativeLab from './pages/CreativeLab';

// Auth Guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
}

// Project Guard: Ensures a band is selected before showing deep metrics
function ProjectGate({ children }) {
  const { activeBandId } = useActiveProject();
  const localStorageId = localStorage.getItem('active_band_id');
  const id = activeBandId || localStorageId;
  return id ? children : <Navigate to="/projects" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Workspace Level */}
        <Route path="/projects" element={<ProtectedRoute><ProjectsOverview /></ProtectedRoute>} />

        {/* Project Specific Level (Gate protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><ProjectGate><Dashboard /></ProjectGate></ProtectedRoute>} />
        <Route path="/posts" element={<ProtectedRoute><ProjectGate><Posts /></ProjectGate></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><ProjectGate><Analytics /></ProjectGate></ProtectedRoute>} />
        <Route path="/creative" element={<ProtectedRoute><ProjectGate><CreativeLab /></ProjectGate></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProjectGate><Profile /></ProjectGate></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/projects" />} />
      </Routes>
    </BrowserRouter>
  );
}
