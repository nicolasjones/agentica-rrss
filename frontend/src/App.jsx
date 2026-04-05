import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useActiveProject } from './context/ActiveProjectContext';
import { HeaderProvider } from './context/HeaderContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProjectsOverview from './pages/ProjectsOverview';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Posts from './pages/Posts';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import CreativeLab from './pages/CreativeLab';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
}

function ProjectGate({ children }) {
  const { activeBandId } = useActiveProject();
  const localStorageId = localStorage.getItem('active_band_id');
  const id = activeBandId || localStorageId;
  return id ? children : <Navigate to="/projects" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <HeaderProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsOverview /></ProtectedRoute>} />

          {/* Layout shell wraps all project-level pages via Outlet */}
          <Route element={
            <ProtectedRoute>
              <ProjectGate>
                <Layout />
              </ProjectGate>
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/creative" element={<CreativeLab />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="/" element={<Navigate to="/projects" />} />
        </Routes>
      </HeaderProvider>
    </BrowserRouter>
  );
}
