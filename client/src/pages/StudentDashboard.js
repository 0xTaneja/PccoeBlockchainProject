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
  const [attendancePercentage, setAttendancePercentage] = useState(75);
  const [showAttendanceSimulation, setShowAttendanceSimulation] = useState(false);
  const [simulatedPercentage, setSimulatedPercentage] = useState(0);

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
        
        const recentlyApproved = response.data.data.find(
          req => req.status === 'approved_by_hod' && !req.viewed
        );
        
        if (recentlyApproved) {
          simulateAttendanceUpdate(recentlyApproved);
        }
      } else {
        console.warn('No leave requests data in response', response.data);
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests. Please try again later.');
    }
  };

  const simulateAttendanceUpdate = (approvedRequest) => {
    const startDate = new Date(approvedRequest.startDate);
    const endDate = new Date(approvedRequest.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const increase = Math.min(5, Math.max(1, Math.round(days * 0.5)));
    const newPercentage = Math.min(100, attendancePercentage + increase);
    
    setSimulatedPercentage(newPercentage);
    setShowAttendanceSimulation(true);
    
    setTimeout(() => {
      setShowAttendanceSimulation(false);
      setAttendancePercentage(newPercentage);
    }, 8000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/auth/student/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProfile(response.data.student);
        
        if (response.data.student.attendance) {
          const percentage = calculateAttendancePercentage(response.data.student.attendance);
          setAttendancePercentage(percentage);
        } else {
          setAttendancePercentage(Math.floor(Math.random() * 25) + 65);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load your profile. Please try again later.');
        
        setAttendancePercentage(Math.floor(Math.random() * 25) + 65);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    fetchLeaveRequests();
  }, [refreshTrigger]);

  const calculateAttendancePercentage = (attendance) => {
    if (!attendance || attendance.length === 0) return 75;
    
    const totalClasses = attendance.reduce((sum, course) => sum + course.totalClasses, 0);
    const classesAttended = attendance.reduce((sum, course) => sum + (course.present + (course.excused || 0)), 0);
    
    return totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100) : 75;
  };

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

  const handleCloseSimulation = () => {
    setShowAttendanceSimulation(false);
    setAttendancePercentage(simulatedPercentage);
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
    const score = confidence || 0;
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
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

        <div className="card mt-6">
          <h3 className="text-lg font-bold mb-4">Attendance Overview</h3>
          
          {showAttendanceSimulation && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 relative">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">
                    Leave request approved!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Attendance updated: {attendancePercentage}% → {simulatedPercentage}%
                  </p>
                </div>
                <button 
                  className="absolute top-1 right-1 text-green-500 hover:text-green-700"
                  onClick={handleCloseSimulation}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mb-1">
            <span>Overall Attendance</span>
            <span className="font-medium">
              {showAttendanceSimulation ? (
                <span className="flex items-center">
                  <span className="line-through text-gray-500 mr-2">{attendancePercentage}%</span>
                  <span className="text-green-600">{simulatedPercentage}%</span>
                </span>
              ) : (
                `${attendancePercentage}%`
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            {showAttendanceSimulation ? (
              <div className="flex">
                <div
                  className="h-2.5 rounded-l-full bg-blue-600"
                  style={{ width: `${Math.min(attendancePercentage, simulatedPercentage)}%` }}
                />
                <div
                  className="h-2.5 rounded-r-full bg-green-500"
                  style={{ width: `${Math.max(0, simulatedPercentage - attendancePercentage)}%` }}
                />
              </div>
            ) : (
              <div 
                className={`h-2.5 rounded-full ${
                  attendancePercentage >= 75 ? 'bg-green-600' : 
                  attendancePercentage >= 60 ? 'bg-yellow-400' : 'bg-red-600'
                }`}
                style={{ width: `${attendancePercentage}%` }}
              />
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {attendancePercentage >= 75 ? (
              <span className="text-green-600">Good standing (75%+ required)</span>
            ) : attendancePercentage >= 60 ? (
              <span className="text-yellow-600">Warning: Below 75% attendance</span>
            ) : (
              <span className="text-red-600">Critical: Below 60% attendance</span>
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
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
                  onClick={handleNewRequest}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  + New Request
                </button>
              </div>
              
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  You don't have any leave requests yet. Create your first request!
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request, index) => (
                    <div key={index} className="p-4 border rounded-md hover:bg-gray-50 transition duration-150">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{request.eventName}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                              {formatStatus(request.status)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            <span className="font-medium">Dates:</span> {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            <span className="ml-3 font-medium">Days:</span> {request.days || Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24) + 1)}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <p className="line-clamp-2">{request.reason}</p>
                          </div>
                          
                          {request.verificationResult && (
                            <div className="bg-gray-50 p-2 rounded-md mb-3">
                              <div className="flex items-center text-xs">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                <span>AI Verification:</span>
                                <span className={`ml-1 font-medium ${getConfidenceColor(request.verificationResult.confidence)}`}>
                                  {request.verificationResult.confidence}% confidence
                                </span>
                              </div>
                              {request.verificationResult.reasoning && (
                                <p className="text-xs mt-1 text-gray-600 line-clamp-2">
                                  {request.verificationResult.reasoning}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t flex justify-between items-center">
                        <div className="flex space-x-3">
                          {request.blockchainHash && (
                            <span className="text-green-600 flex items-center text-xs">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Blockchain Verified
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-3">
                          {request.ipfsDocLink && (
                            <button 
                              onClick={() => openDocument(request.ipfsDocLink)}
                              className="text-sm flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                              Document
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewDetails(request)}
                            className="text-sm flex items-center text-indigo-600 hover:text-indigo-800"
                          >
                            Details
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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