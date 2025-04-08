import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentDashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/auth/student/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProfile(response.data.student);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load your profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  const student = profile || user.student;

  // Calculate attendance percentage
  const calculateAttendancePercentage = (attendance) => {
    if (!attendance || attendance.length === 0) return 0;
    
    const totalClasses = attendance.reduce((sum, course) => sum + course.totalClasses, 0);
    const classesAttended = attendance.reduce((sum, course) => sum + course.present, 0);
    
    return totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100) : 0;
  };

  const attendancePercentage = calculateAttendancePercentage(student.attendance);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Student Profile Card */}
      <div className="md:col-span-1">
        <div className="card">
          <div className="text-center mb-4">
            <div className="w-24 h-24 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-white text-2xl font-bold">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold mt-2">{student.name}</h2>
            <p className="text-gray-600">{student.email}</p>
            <p className="text-sm text-gray-500 mt-1">Student ID: {student.studentId}</p>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Department:</span>
              <span className="font-medium">{student.department}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Year:</span>
              <span className="font-medium">{student.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Division:</span>
              <span className="font-medium">{student.division}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="md:col-span-2">
        {/* Attendance Overview */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold mb-4">Attendance Overview</h3>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span>Overall Attendance</span>
              <span className="font-medium">{attendancePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  attendancePercentage >= 75 ? 'bg-green-600' : 
                  attendancePercentage >= 60 ? 'bg-yellow-400' : 'bg-red-600'
                }`}
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {student.attendance && student.attendance.map((course, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{course.courseId?.name || 'Unknown Course'}</span>
                  <span className="text-sm">{course.present} / {course.totalClasses} classes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (course.present / course.totalClasses) * 100 >= 75 ? 'bg-green-600' : 
                      (course.present / course.totalClasses) * 100 >= 60 ? 'bg-yellow-400' : 'bg-red-600'
                    }`}
                    style={{ width: `${course.totalClasses > 0 ? (course.present / course.totalClasses) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Recent Leave Requests</h3>
            <button className="btn btn-primary text-sm">+ New Request</button>
          </div>

          {student.leaveRequests && student.leaveRequests.length > 0 ? (
            <div className="space-y-3">
              {student.leaveRequests.map((request, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{request.eventName || 'Leave Application'}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-1">{request.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No leave requests found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 