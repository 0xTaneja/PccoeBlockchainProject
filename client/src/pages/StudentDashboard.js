import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LeaveRequestForm from '../components/LeaveRequestForm';
import LeaveRequestVerification from '../components/LeaveRequestVerification';
import Modal from '../components/Modal';

const StudentDashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.data) {
        setLeaveRequests(response.data.data);
      } else {
        console.warn('No leave requests data in response', response.data);
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests. Please try again later.');
    }
  };

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
    fetchLeaveRequests();
  }, [refreshTrigger]);

  const handleNewRequest = () => {
    setShowRequestForm(true);
    setSelectedRequest(null);
  };

  const handleCancelRequest = () => {
    setShowRequestForm(false);
    refreshData();
  };

  const handleRequestSubmitted = (newRequest) => {
    setShowRequestForm(false);
    refreshData();
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowRequestForm(false);
  };

  const openDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Document link not available');
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

  const student = profile || user.student;

  const calculateAttendancePercentage = (attendance) => {
    if (!attendance || attendance.length === 0) return 0;
    
    const totalClasses = attendance.reduce((sum, course) => sum + course.totalClasses, 0);
    const classesAttended = attendance.reduce((sum, course) => sum + course.present, 0);
    
    return totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100) : 0;
  };

  const attendancePercentage = calculateAttendancePercentage(student.attendance);

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved_by_hod':
        return 'bg-green-100 text-green-800';
      case 'approved_by_teacher':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatStatus = (status) => {
    switch(status) {
      case 'approved_by_hod':
        return 'Fully Approved';
      case 'approved_by_teacher':
        return 'Teacher Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="md:col-span-2">
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

        <div className="card">
          {showRequestForm ? (
            <Modal isOpen={true} onClose={() => setShowRequestForm(false)}>
              <LeaveRequestForm 
                onSubmit={handleRequestSubmitted} 
                onCancel={handleCancelRequest}
              />
            </Modal>
          ) : null}
          
          {selectedRequest ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Leave Request Details</h3>
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setSelectedRequest(null)}
                >
                  ← Back to List
                </button>
              </div>
              <LeaveRequestVerification leaveRequestId={selectedRequest._id} />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Leave Requests</h3>
                <button 
                  className="btn btn-primary text-sm"
                  onClick={handleNewRequest}
                >
                  + New Request
                </button>
              </div>

              {leaveRequests && leaveRequests.length > 0 ? (
                <div className="space-y-3">
                  {leaveRequests.map((request, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between">
                        <span className="font-medium">{request && request.eventName ? request.eventName : 'Leave Application'}</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${getStatusBadgeClass(request ? request.status : 'pending')}`}>
                          {formatStatus(request ? request.status : 'pending')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {request && request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'} - 
                        {request && request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-sm mt-1 truncate">{request && request.reason ? request.reason : 'No reason provided'}</p>
                      
                      {request && request.verificationResult && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center text-xs">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span>AI Verification: </span>
                            <span className={`ml-1 font-medium ${getConfidenceColor(request.verificationResult.confidence)}`}>
                              {request.verificationResult.confidence}% confidence
                            </span>
                          </div>
                          {request.verificationResult.reasoning && (
                            <div className="text-xs mt-1 text-gray-600 overflow-hidden text-ellipsis" style={{maxHeight: '2.5rem'}}>
                              {request.verificationResult.reasoning.length > 100 
                                ? `${request.verificationResult.reasoning.substring(0, 100)}...` 
                                : request.verificationResult.reasoning
                              }
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex space-x-2 items-center">
                          {request && request.blockchainHash && (
                            <span className="text-green-600 flex items-center text-xs">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Blockchain Verified
                            </span>
                          )}
                          
                          {request && request.ipfsDocLink && (
                            <button 
                              onClick={() => openDocument(request.ipfsDocLink)}
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                              View Document
                            </button>
                          )}
                        </div>
                        
                        <button
                          onClick={() => request && request._id ? handleViewDetails(request) : null}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          disabled={!request || !request._id}
                        >
                          View Details
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No leave requests found. Create your first request!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 