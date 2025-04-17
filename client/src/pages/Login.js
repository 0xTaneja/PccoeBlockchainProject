import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`/api/auth/${userType}/login`, {
        email,
        password
      });

      const { token, student, teacher } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Call onLogin with appropriate user data
      onLogin({ 
        token, 
        student: userType === 'student' ? student : null,
        teacher: userType === 'teacher' ? teacher : null
      });
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-800">PCCOE ERP System</h1>
          <p className="mt-2 text-gray-600">Sign in to access your dashboard</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex mb-6 border rounded-md overflow-hidden">
            <button
              className={`flex-1 py-2 ${userType === 'student' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setUserType('student')}
            >
              Student
            </button>
            <button
              className={`flex-1 py-2 ${userType === 'teacher' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setUserType('teacher')}
            >
              Teacher
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder={`${userType === 'student' ? 'student' : 'teacher'}01@example.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Hint: Use credentials from the seeded data (password123)
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 