import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LeaveRequestForm from '../components/LeaveRequestForm';

const StudentLeave = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await axios.get('/api/leave-requests/student', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setLeaveRequests(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        setError('Failed to load leave requests. Please try again later.');
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [refreshTrigger]);

  const handleLeaveRequestSubmitted = () => {
    // Trigger a refresh of the leave requests list
    setRefreshTrigger(prev => prev + 1);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved_by_hod':
        return 'bg-green-100 text-green-800';
      case 'approved_by_teacher':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatStatus = (status) => {
    switch (status) {
      case 'approved_by_hod':
        return 'Approved';
      case 'approved_by_teacher':
        return 'Teacher Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };
  
  const handleRowClick = (request) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };
  
  const LeaveRequestDetails = ({ request, onClose }) => {
    if (!request) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Leave Request Details</h3>
            <button 
              onClick={onClose}
              className="bg-white rounded-md p-2 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-semibold">{request.eventName || 'Leave Request'}</h4>
                <p className="text-sm text-gray-500">Submitted on {new Date(request.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                {formatStatus(request.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-2">Details</h5>
                <div className="bg-gray-50 rounded-md p-4 space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block">Leave Type</span>
                    <span className="text-sm font-medium">{request.leaveType}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Duration</span>
                    <span className="text-sm font-medium">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} 
                      ({request.days} {request.days === 1 ? 'day' : 'days'})
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Reason</span>
                    <span className="text-sm">{request.reason}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-2">Document Verification</h5>
                <div className="bg-gray-50 rounded-md p-4 space-y-3">
                  {request.blockchainHash ? (
                    <>
                      <div>
                        <span className="text-xs text-gray-500 block">Document Hash</span>
                        <span className="text-sm font-mono break-all">{request.blockchainHash}</span>
                      </div>
                      {request.ipfsDocLink && (
                        <div>
                          <span className="text-xs text-gray-500 block">IPFS Link</span>
                          <a 
                            href={request.ipfsDocLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-mono break-all"
                          >
                            {request.ipfsDocLink}
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">No blockchain verification available</div>
                  )}
                </div>
              </div>
            </div>
            
            {request.verificationResult && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-500 mb-2">AI Verification Results</h5>
                <div className={`rounded-md p-4 ${
                  request.verificationResult.verified 
                    ? request.verificationResult.confidence > 80 
                      ? 'bg-green-50' 
                      : 'bg-yellow-50' 
                    : 'bg-red-50'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {request.verificationResult.verified ? (
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h6 className="text-sm font-medium">
                        {request.verificationResult.verified 
                          ? `Event verified with ${request.verificationResult.confidence}% confidence` 
                          : `Verification issues detected (${request.verificationResult.confidence}% confidence)`
                        }
                      </h6>
                      <p className="text-sm mt-1">{request.verificationResult.reasoning}</p>
                      {request.verificationResult.recommendedAction && (
                        <p className="text-sm mt-1">
                          <strong>Recommended action:</strong> {request.verificationResult.recommendedAction.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(request.classTeacherApproval?.approved || request.classTeacherApproval?.approved === false) && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-500 mb-2">Teacher Review</h5>
                <div className={`rounded-md p-4 ${request.classTeacherApproval.approved ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {request.classTeacherApproval.approved ? (
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h6 className="text-sm font-medium">
                        {request.classTeacherApproval.approved ? 'Approved by teacher' : 'Rejected by teacher'}
                      </h6>
                      {request.classTeacherApproval.approvedBy && (
                        <p className="text-sm text-gray-600">
                          {request.classTeacherApproval.approvedBy.name}, {new Date(request.classTeacherApproval.approvedAt).toLocaleString()}
                        </p>
                      )}
                      {request.classTeacherApproval.comments && (
                        <p className="text-sm mt-1">"{request.classTeacherApproval.comments}"</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(request.hodApproval?.approved || request.hodApproval?.approved === false) && (
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-2">HOD Review</h5>
                <div className={`rounded-md p-4 ${request.hodApproval.approved ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {request.hodApproval.approved ? (
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h6 className="text-sm font-medium">
                        {request.hodApproval.approved ? 'Approved by HOD' : 'Rejected by HOD'}
                      </h6>
                      {request.hodApproval.approvedBy && (
                        <p className="text-sm text-gray-600">
                          {request.hodApproval.approvedBy.name}, {new Date(request.hodApproval.approvedAt).toLocaleString()}
                        </p>
                      )}
                      {request.hodApproval.comments && (
                        <p className="text-sm mt-1">"{request.hodApproval.comments}"</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Leave Requests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b">
              <h2 className="text-lg font-medium">Your Leave Requests</h2>
            </div>
            
            {loading ? (
              <div className="p-4 text-center">Loading your leave requests...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : leaveRequests.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No leave requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event/Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveRequests.map((request) => (
                      <tr 
                        key={request._id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(request)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{request.eventName || 'No Event Name'}</div>
                          <div className="text-xs text-gray-500">{request.leaveType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {request.days} {request.days === 1 ? 'day' : 'days'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {request.verificationResult ? (
                            <div className="flex items-center">
                              {request.verificationResult.verified ? (
                                <svg className="h-4 w-4 text-green-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4 text-red-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>
                                {request.verificationResult.confidence}% confidence
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not verified</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                            {formatStatus(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="text-indigo-600 hover:text-indigo-800"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              handleRowClick(request);
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b">
              <h2 className="text-lg font-medium">New Leave Request</h2>
            </div>
            <div className="p-4">
              <LeaveRequestForm onSubmitSuccess={handleLeaveRequestSubmitted} />
            </div>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <LeaveRequestDetails 
          request={selectedRequest} 
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default StudentLeave; 