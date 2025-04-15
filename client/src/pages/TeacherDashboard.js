import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  FiUser, FiBook, FiCalendar, FiCheckSquare, 
  FiClock, FiFileText, FiX, FiCheck 
} from 'react-icons/fi';

const TeacherDashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch teacher profile
        const profileResponse = await axios.get('/api/auth/teacher/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Teacher profile response:', profileResponse.data);
        
        // Fix: Extract teacher data correctly from the response
        const teacherProfile = profileResponse.data.teacher;
        setProfile(teacherProfile);

        // Fetch pending leave requests based on teacher role
        try {
          // Choose the appropriate endpoint based on teacher role
          let endpoint = '/api/leave-requests/teacher?status=pending';
          
          if (teacherProfile.isClassTeacher) {
            endpoint = '/api/leave-requests/pending/teacher';
          } else if (teacherProfile.isHod) {
            endpoint = '/api/leave-requests/pending/hod';
          }
          
          const leaveRequestsResponse = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Leave requests API response:', leaveRequestsResponse.data);
          
          // Handle response
          const leaveRequests = leaveRequestsResponse.data.data || [];
          setPendingLeaveRequests(leaveRequests);
        } catch (leaveRequestError) {
          console.error('Error fetching leave requests:', leaveRequestError);
          setError('Failed to load leave requests. Please try again later.');
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setError('Failed to load teacher data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveLeaveRequest = async (id) => {
    setRequestLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Determine which approval endpoint to use based on teacher role
      let endpoint = `/api/leave-requests/${id}/approve`;
      
      if (profile.isClassTeacher) {
        endpoint = `/api/leave-requests/${id}/approve/teacher`;
      } else if (profile.isHod) {
        endpoint = `/api/leave-requests/${id}/approve/hod`;
      }
      
      await axios.put(endpoint, 
        { comments: 'Approved by teacher' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update UI
      setPendingLeaveRequests(prev => prev.filter(req => req._id !== id));
    } catch (error) {
      console.error('Error approving leave request:', error);
      alert('Failed to approve leave request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRejectLeaveRequest = async (id) => {
    setRequestLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/leave-requests/${id}/reject`, 
        { reason: 'Rejected by teacher' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update UI
      setPendingLeaveRequests(prev => prev.filter(req => req._id !== id));
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      alert('Failed to reject leave request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
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
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex-1">
              <div className="flex items-center mb-6">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <FiUser className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center mt-3">
                  <FiBook className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-700">Department: <span className="font-medium">{profile.department?.name || 'Not assigned'}</span></span>
                </div>
                
                {profile.isClassTeacher && (
                  <div className="flex items-center mt-3">
                    <FiCalendar className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">Class Teacher: <span className="font-medium">{profile.classTeacherOf?.name || 'Not assigned'}</span></span>
                  </div>
                )}
                
                {profile.isHod && (
                  <div className="flex items-center mt-3">
                    <FiCheckSquare className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">HOD of: <span className="font-medium">{profile.hodOf?.name || 'Not assigned'}</span></span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Courses Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex-1">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold">Your Courses</h2>
              </div>
              {profile.courses && profile.courses.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {profile.courses.map((course, index) => (
                    <li key={course._id || index} className="py-3">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <FiBook className="h-5 w-5 text-primary mr-2" />
                          <span className="font-medium">{course.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{course.code}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {course.semester} Semester • {course.branch?.name || 'All Branches'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No courses assigned yet.</p>
              )}
            </div>
          </div>

          {/* Pending Leave Requests */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Pending Leave Requests</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium py-1 px-2 rounded-full">
                {pendingLeaveRequests.length} Pending
              </span>
            </div>

            {requestLoading && (
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            {!requestLoading && pendingLeaveRequests.length === 0 ? (
              <div className="text-center py-6">
                <FiClock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No pending requests</h3>
                <p className="mt-1 text-sm text-gray-500">All leave requests have been processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingLeaveRequests.map((request) => {
                      // Format dates
                      const fromDate = new Date(request.fromDate).toLocaleDateString();
                      const toDate = new Date(request.toDate).toLocaleDateString();
                      
                      return (
                        <tr key={request._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {request.student?.name || 'Unknown Student'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {request.student?.email || 'No email'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {request.student?.rollNo || 'No Roll No'} • {request.student?.branch?.name || 'Unknown Branch'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{fromDate}</div>
                            <div className="text-sm text-gray-500">to {toDate}</div>
                            <div className="text-xs text-gray-500">
                              {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{request.reason}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {request.documentUrl ? (
                              <a 
                                href={request.documentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                              >
                                <FiFileText className="mr-1" /> View
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">No document</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveLeaveRequest(request._id)}
                                className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-full flex items-center"
                                disabled={requestLoading}
                              >
                                <FiCheck className="mr-1" /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectLeaveRequest(request._id)}
                                className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-full flex items-center"
                                disabled={requestLoading}
                              >
                                <FiX className="mr-1" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard; 