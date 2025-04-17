import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Determine the correct endpoint based on user type - these were wrong before
        const endpoint = user.student 
          ? '/api/auth/student/me' 
          : '/api/auth/teacher/me';
        
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // The data structure from the API is different than previously expected
        if (user.student) {
          setProfile(response.data.student);
        } else {
          setProfile(response.data.teacher);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const displayUserInfo = () => {
    // Use user data from props as fallback if profile not loaded yet
    const userData = profile || (user.student ? user.student : user.teacher);
    
    if (!userData) return null;
    
    if (user.student) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <div className="mt-1 text-sm text-gray-900">{userData.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 text-sm text-gray-900">{userData.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <div className="mt-1 text-sm text-gray-900">{userData.mobileNumber || 'Not provided'}</div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium">Academic Information</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Student ID</label>
                <div className="mt-1 text-sm text-gray-900">{userData.studentId}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Department</label>
                <div className="mt-1 text-sm text-gray-900">{userData.department}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Year & Division</label>
                <div className="mt-1 text-sm text-gray-900">Year {userData.year}, Division {userData.division}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Roll Number</label>
                <div className="mt-1 text-sm text-gray-900">{userData.rollNumber}</div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <div className="mt-1 text-sm text-gray-900">{userData.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 text-sm text-gray-900">{userData.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <div className="mt-1 text-sm text-gray-900">{userData.mobileNumber || 'Not provided'}</div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium">Professional Information</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Teacher ID</label>
                <div className="mt-1 text-sm text-gray-900">{userData.employeeId}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Department</label>
                <div className="mt-1 text-sm text-gray-900">{userData.department}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Roles</label>
                <div className="mt-1 text-sm text-gray-900">
                  {userData.isHod && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">HOD</span>}
                  {userData.isClassTeacher && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">Class Teacher</span>}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Teacher</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center">
          <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-semibold mr-4">
            {user.student 
              ? user.student.name.charAt(0).toUpperCase() 
              : user.teacher.name.charAt(0).toUpperCase()
            }
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.student ? user.student.name : user.teacher.name}
            </h2>
            <p className="text-sm text-gray-500">
              {user.student ? 'Student' : 'Teacher'}
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <div className="text-center py-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-gray-600">Loading profile information...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">
                {error}
                <div className="mt-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              displayUserInfo()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 