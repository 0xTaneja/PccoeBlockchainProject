import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiFileText, FiClock, FiCheck, FiX } from 'react-icons/fi';

const TeacherLeave = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchLeaveRequests();
  }, [filter]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Map UI filter values to API filter values
      const apiStatus = filter.toLowerCase();
      
      // Use the teacher leave requests endpoint with appropriate filter
      const endpoint = `/api/leave-requests/teacher${apiStatus === 'all' ? '' : `?status=${apiStatus}`}`;
      
      console.log(`Fetching leave requests from: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Leave requests response:', response.data);
      
      if (response.data && response.data.success) {
        setLeaveRequests(response.data.data || []);
        console.log(`Loaded ${response.data.data.length} leave requests`);
      } else {
        console.error('Invalid API response format:', response.data);
        setError('Failed to load leave requests. Invalid response format.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests. Please try again later.');
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      setActionLoading(requestId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const endpoint = `/api/leave-requests/${requestId}/${action.toLowerCase()}`;
      console.log(`Performing ${action} action using endpoint: ${endpoint}`);
      
      const response = await axios.put(endpoint, {
        comments: `${action}d by teacher via dashboard`
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Action response:', response.data);
      
      // Refresh the leave requests after action
      await fetchLeaveRequests();
      
      setActionLoading(null);
    } catch (err) {
      console.error(`Error ${action.toLowerCase()}ing leave request:`, err);
      setError(`Failed to ${action.toLowerCase()} the leave request. Please try again.`);
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved_by_teacher':
      case 'approved_by_hod':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'approved_by_teacher':
        return 'Approved by Teacher';
      case 'approved_by_hod':
        return 'Approved by HOD';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Leave Requests</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-40 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved_by_teacher">Approved by Teacher</option>
            <option value="approved_by_hod">Approved by HOD</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => fetchLeaveRequests()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiClock className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FiClock className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No leave requests found</h3>
            <p className="mt-1 text-gray-500">There are no leave requests matching your selected filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {leaveRequests.map((request) => (
              <li key={request._id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{request.student?.name || 'Student'}</h3>
                      <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {getStatusDisplay(request.status)}
                      </span>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {request.student?.email} • {request.student?.rollNo || 'ID N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(request._id, 'approve')}
                          disabled={actionLoading === request._id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <FiCheck className="mr-1" />
                          {actionLoading === request._id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(request._id, 'reject')}
                          disabled={actionLoading === request._id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <FiX className="mr-1" />
                          {actionLoading === request._id ? 'Processing...' : 'Reject'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.leaveType}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      <span className="block text-xs text-gray-500">
                        {request.days} {request.days === 1 ? 'day' : 'days'}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Event</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.eventName}</dd>
                  </div>
                </div>
                
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{request.reason}</dd>
                </div>
                
                {request.documentProof && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Supporting Document</dt>
                    <dd className="mt-1">
                      <a 
                        href={request.ipfsDocLink || `/uploads/${request.documentProof.split('/').pop()}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                      >
                        <FiFileText className="mr-1" />
                        View Document
                      </a>
                    </dd>
                  </div>
                )}
                
                {request.status !== 'pending' && (
                  <div className="mt-4 pt-3 border-t">
                    <dt className="text-sm font-medium text-gray-500">
                      {request.status === 'rejected' ? 'Rejected by' : 'Approved by'}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {request.status === 'approved_by_teacher' 
                        ? request.classTeacherApproval?.approvedBy?.name || 'Class Teacher'
                        : request.status === 'approved_by_hod'
                          ? request.hodApproval?.approvedBy?.name || 'HOD'
                          : request.classTeacherApproval?.approvedBy?.name || 'Teacher'
                      }
                      <span className="text-xs text-gray-500 ml-2">
                        ({new Date(request.updatedAt).toLocaleDateString()})
                      </span>
                    </dd>
                    {((request.classTeacherApproval && request.classTeacherApproval.comments) ||
                      (request.hodApproval && request.hodApproval.comments)) && (
                      <div className="mt-1">
                        <dt className="text-sm font-medium text-gray-500">Comments</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {request.status === 'approved_by_teacher' || request.status === 'rejected'
                            ? request.classTeacherApproval?.comments
                            : request.hodApproval?.comments}
                        </dd>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherLeave; 