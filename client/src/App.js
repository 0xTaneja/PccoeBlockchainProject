import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentAttendance from './pages/StudentAttendance';
import Navbar from './components/Navbar';

// Import new components
import StudentLeave from './pages/StudentLeave';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherCourses from './pages/TeacherCourses';
import TeacherLeave from './pages/TeacherLeave';
import UserProfile from './pages/UserProfile';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token and user in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={!user ? <Login onLogin={handleLogin} /> : 
            (user.student ? <Navigate to="/student" /> : <Navigate to="/teacher" />)} 
          />
          
          {/* Student Routes */}
          <Route path="/student" element={user && user.student ? <StudentDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/student/attendance" element={user && user.student ? <StudentAttendance user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/student/leave" element={user && user.student ? <StudentLeave user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher" element={user && user.teacher ? <TeacherDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/teacher/courses" element={user && user.teacher ? <TeacherCourses user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/teacher/attendance" element={user && user.teacher ? <TeacherAttendance user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/teacher/leave" element={user && user.teacher ? <TeacherLeave user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          
          {/* Common Routes */}
          <Route path="/profile" element={user ? <UserProfile user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App; 