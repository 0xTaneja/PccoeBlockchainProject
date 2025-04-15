import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeacherLeave = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('All');

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
      
      // Use different endpoints based on filter
      const endpoint = filter === 'All' 
        ? '/api/leave-requests/teacher'
        : `/api/leave-requests/teacher?status=${filter}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setLeaveRequests(response.data);
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
      
      await axios.put(`/api/leave-requests/${requestId}/${action.toLowerCase()}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update the local state to reflect the change
      setLeaveRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId 
            ? { ...req, status: action === 'approve' ? 'Approved' : 'Rejected' } 
            : req
        )
      );
      
      setActionLoading(null);
    } catch (err) {
      console.error(`Error ${action.toLowerCase()}ing leave request:`, err);
      setError(`Failed to ${action.toLowerCase()} the leave request. Please try again.`);
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Leave Requests</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-40 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="All">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button
            onClick={() => fetchLeaveRequests()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-6 text-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No leave requests found for the selected filter.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {leaveRequests.map((request) => (
              <li key={request._id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{request.student?.name || 'Student'}</h3>
                      <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {request.student?.email} • {request.student?.studentId || 'ID N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {request.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleAction(request._id, 'approve')}
                          disabled={actionLoading === request._id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading === request._id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(request._id, 'reject')}
                          disabled={actionLoading === request._id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
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
                    <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                    <dd className="mt-1 text-sm text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</dd>
                  </div>
                </div>
                
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{request.reason}</dd>
                </div>
                
                {(request.status === 'Approved' || request.status === 'Rejected') && (
                  <div className="mt-4 pt-3 border-t">
                    <dt className="text-sm font-medium text-gray-500">
                      {request.status === 'Approved' ? 'Approved' : 'Rejected'} by
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {request.actionBy?.name || 'Unknown Teacher'} ({new Date(request.updatedAt).toLocaleDateString()})
                    </dd>
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