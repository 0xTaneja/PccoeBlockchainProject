import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeacherDashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/auth/teacher/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProfile(response.data.teacher);
        
        // In a real app, we would fetch pending leave requests
        // For now, we'll simulate it with sample data
        setPendingLeaveRequests([
          {
            id: '1',
            studentName: 'Rahul Sharma',
            studentId: 'S2021001',
            startDate: '2023-04-15',
            endDate: '2023-04-16',
            reason: 'Medical appointment',
            eventName: 'Medical Leave',
            status: 'pending'
          },
          {
            id: '2',
            studentName: 'Priya Patel',
            studentId: 'S2021024',
            startDate: '2023-04-20',
            endDate: '2023-04-22',
            reason: 'Family function',
            eventName: 'Personal Leave',
            status: 'pending'
          }
        ]);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load your profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleApproveLeave = async (id) => {
    // In a real app, make an API call
    // For now, just update the UI
    setPendingLeaveRequests(
      pendingLeaveRequests.filter(request => request.id !== id)
    );
  };

  const handleRejectLeave = async (id) => {
    // In a real app, make an API call
    // For now, just update the UI
    setPendingLeaveRequests(
      pendingLeaveRequests.filter(request => request.id !== id)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  const teacher = profile || user.teacher;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Teacher Profile Card */}
      <div className="md:col-span-1">
        <div className="card">
          <div className="text-center mb-4">
            <div className="w-24 h-24 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-white text-2xl font-bold">
              {teacher.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold mt-2">{teacher.name}</h2>
            <p className="text-gray-600">{teacher.email}</p>
            <p className="text-sm text-gray-500 mt-1">Employee ID: {teacher.employeeId}</p>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Department:</span>
              <span className="font-medium">{teacher.department}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Designation:</span>
              <span className="font-medium">{teacher.designation}</span>
            </div>
            <div className="mt-2">
              {teacher.isHod && (
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm inline-block mr-2">
                  Head of Department
                </div>
              )}
              {teacher.isClassTeacher && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm inline-block">
                  Class Teacher
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="md:col-span-2">
        {/* Course Overview */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold mb-4">Your Courses</h3>
          
          {teacher.courses && teacher.courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teacher.courses.map((course, index) => (
                <div key={index} className="p-4 border rounded-md hover:shadow-md transition-shadow">
                  <h4 className="font-bold">{course.name}</h4>
                  <p className="text-sm text-gray-600">Code: {course.courseCode}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800">View Details</button>
                    <button className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                      Take Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No courses assigned yet.
            </div>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Pending Leave Requests</h3>
          
          {pendingLeaveRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingLeaveRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{request.studentName}</h4>
                      <p className="text-sm text-gray-600">ID: {request.studentId}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full">
                      Pending
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium">{request.eventName}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm mt-1">{request.reason}</p>
                  </div>
                  
                  <div className="mt-3 flex space-x-2 justify-end">
                    <button 
                      onClick={() => handleRejectLeave(request.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApproveLeave(request.id)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No pending leave requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard; 