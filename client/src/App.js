import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={!user ? <Login onLogin={handleLogin} /> : 
            user.student ? <Navigate to="/student" /> : <Navigate to="/teacher" />} 
          />
          <Route 
            path="/student" 
            element={user && user.student ? <StudentDashboard user={user} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/teacher" 
            element={user && user.teacher ? <TeacherDashboard user={user} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App; 