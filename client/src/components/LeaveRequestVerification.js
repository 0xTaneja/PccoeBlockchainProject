import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaveRequestVerification = ({ leaveRequestId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveRequest, setLeaveRequest] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leave request data
        const response = await axios.get(`/api/leave-requests/${leaveRequestId}`);
        setLeaveRequest(response.data.data);
        
        // Fetch blockchain verification if hash exists
        if (response.data.data.blockchainHash) {
          try {
            const verificationResponse = await axios.get(`/api/blockchain/verify/${response.data.data.blockchainHash}`);
            setVerificationData(verificationResponse.data);
          } catch (verifyError) {
            console.error('Error fetching blockchain verification:', verifyError);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch leave request data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [leaveRequestId]);
  
  if (loading) {
    return <div className="p-4 bg-gray-100 rounded-lg shadow">Loading verification data...</div>;
  }
  
  if (error) {
    return <div className="p-4 bg-red-100 text-red-800 rounded-lg shadow">Error: {error}</div>;
  }
  
  if (!leaveRequest) {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg shadow">Leave request not found</div>;
  }
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <span className="text-yellow-500">⏳</span>;
      case 'approved_by_teacher':
        return <span className="text-blue-500">👨‍🏫</span>;
      case 'approved_by_hod':
        return <span className="text-green-500">✅</span>;
      case 'rejected':
        return <span className="text-red-500">❌</span>;
      default:
        return <span className="text-gray-500">❓</span>;
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Leave Request Verification
        </h3>
        <div className="flex space-x-2 items-center">
          {getStatusIcon(leaveRequest.status)}
          <span className="text-sm font-medium text-gray-700">
            {leaveRequest.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600">Event: <span className="font-medium text-gray-900">{leaveRequest.eventName}</span></div>
        <div className="text-sm text-gray-600">
          Dates: <span className="font-medium text-gray-900">
            {new Date(leaveRequest.startDate).toLocaleDateString()} - {new Date(leaveRequest.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h4 className="text-md font-semibold text-gray-700">Blockchain Verification</h4>
        </div>
        
        {leaveRequest.blockchainHash ? (
          <>
            <div className="pl-8 text-sm">
              <div className="text-gray-600 mb-1">Blockchain Hash: 
                <span className="ml-1 font-mono text-xs bg-gray-100 p-1 rounded">
                  {leaveRequest.blockchainHash.slice(0, 10)}...{leaveRequest.blockchainHash.slice(-6)}
                </span>
              </div>
              
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                {expanded ? 'Hide' : 'Show'} Verification Details
              </button>
              
              {expanded && (
                <div className="mt-2 bg-gray-50 p-2 rounded">
                  {verificationData ? (
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(verificationData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-500">Verification data not available</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="pl-8 text-sm text-gray-500">
            Not verified on blockchain
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h4 className="text-md font-semibold text-gray-700">IPFS Document</h4>
        </div>
        
        {leaveRequest.ipfsDocLink ? (
          <div className="pl-8 text-sm">
            <a 
              href={leaveRequest.ipfsDocLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              View Document on IPFS
            </a>
            <div className="mt-2 text-xs text-gray-500">
              <div>IPFS Hash: <code className="bg-gray-100 p-1 rounded">{leaveRequest.ipfsDocLink.split('/').pop()}</code></div>
              <div className="mt-1">
                Note: If Pinata gateway is not accessible, you can use any IPFS gateway by replacing the domain:
                <div className="mt-1">
                  <a 
                    href={`https://ipfs.io/ipfs/${leaveRequest.ipfsDocLink.split('/').pop()}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Try ipfs.io gateway
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pl-8 text-sm text-gray-500">
            Document not stored on IPFS
          </div>
        )}
      </div>
      
      {/* AI Verification section */}
      {leaveRequest.verificationResult && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h4 className="text-md font-semibold text-gray-700">AI Verification</h4>
          </div>
          
          <div className="pl-8 text-sm">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${leaveRequest.verificationResult.verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-gray-700">Verification Status:</span>
              <span className={`ml-1 font-medium ${leaveRequest.verificationResult.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {leaveRequest.verificationResult.verified ? 'Verified' : 'Needs Review'}
              </span>
            </div>
            
            <div className="mt-2">
              <div className="text-gray-700">Confidence Score: 
                <span className={`ml-1 font-medium ${
                  leaveRequest.verificationResult.confidence >= 80 ? 'text-green-600' : 
                  leaveRequest.verificationResult.confidence >= 50 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {leaveRequest.verificationResult.confidence}%
                </span>
              </div>
              
              {leaveRequest.verificationResult.reasoning && (
                <div className="mt-2">
                  <div className="text-gray-700">AI Reasoning:</div>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                    {leaveRequest.verificationResult.reasoning}
                  </div>
                </div>
              )}
              
              {leaveRequest.verificationResult.ipfsLink && (
                <div className="mt-2">
                  <a 
                    href={leaveRequest.verificationResult.ipfsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-xs flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    View Full Verification Data on IPFS
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Approvals section */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h4 className="text-md font-semibold text-gray-700">Approvals</h4>
        </div>
        
        <div className="pl-8">
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${leaveRequest.classTeacherApproval?.approved ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-700">Teacher Approval:</span>
            <span className="text-sm ml-1">
              {leaveRequest.classTeacherApproval?.approved ? (
                <span className="text-green-600 font-medium">Approved</span>
              ) : (
                <span className="text-gray-500">Pending</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${leaveRequest.hodApproval?.approved ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-700">HOD Approval:</span>
            <span className="text-sm ml-1">
              {leaveRequest.hodApproval?.approved ? (
                <span className="text-green-600 font-medium">Approved</span>
              ) : (
                <span className="text-gray-500">Pending</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestVerification; 