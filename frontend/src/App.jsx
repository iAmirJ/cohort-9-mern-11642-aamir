import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotesList from './pages/dashboard/NotesList';
import NoteEditor from './pages/dashboard/NoteEditor';
import NoteDetail from './pages/dashboard/NoteDetail';
import TrashList from './pages/dashboard/TrashList';
import ProfileSettings from './pages/dashboard/ProfileSettings';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<NotesList />} />
            <Route path="/notes/:id" element={<NoteDetail />} />
            <Route path="/editor" element={<NoteEditor />} />
            <Route path="/editor/:id" element={<NoteEditor />} />
            <Route path="/trash" element={<TrashList />} />
            <Route path="/profile" element={<ProfileSettings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
