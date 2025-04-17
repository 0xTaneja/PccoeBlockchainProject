import React, { useState } from 'react';
import axios from 'axios';
import { format, differenceInDays, parseISO } from 'date-fns';

const LeaveRequestForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    leaveType: 'Sick',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    eventName: '',
  });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [blockchainHash, setBlockchainHash] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
  
  const leaveTypes = ['Sick', 'Personal', 'Academic', 'Family', 'Other'];
  
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      return differenceInDays(end, start) + 1;
    }
    return 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous errors/success when form is being edited
    setError(null);
    setSuccess(false);
    setVerificationResult(null);
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Client-side validation
    const validationErrors = {};
    if (!formData.leaveType) validationErrors.leaveType = 'Leave type is required';
    if (!formData.startDate) validationErrors.startDate = 'Start date is required';
    if (!formData.endDate) validationErrors.endDate = 'End date is required';
    if (!formData.reason) validationErrors.reason = 'Reason is required';
    if (!file && !fileName) validationErrors.documentProof = 'Document proof is required';
    
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create form data for file upload
      const form = new FormData();
      form.append('leaveType', formData.leaveType);
      form.append('startDate', formData.startDate);
      form.append('endDate', formData.endDate);
      form.append('reason', formData.reason);
      form.append('eventName', formData.eventName || '');
      
      // Calculate days between dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
      
      form.append('days', diffDays);
      
      if (file) {
        form.append('documentProof', file);
      }
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      try {
        // API call to submit leave request
        const response = await axios.post('/api/leave-requests', form, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Leave request submitted successfully:', response.data);
        
        // Reset form
        setFormData({
          leaveType: '',
          startDate: '',
          endDate: '',
          reason: '',
          eventName: ''
        });
        setFile(null);
        setFileName('');
        
        // Notify parent component
        if (onSubmitSuccess) onSubmitSuccess();
        
        // Show success message
        setSubmitStatus({ success: true, message: 'Leave request submitted successfully!' });
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Continue with localStorage storage even if API fails
      }

      // Also store in localStorage as a backup (even if API succeeded)
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        const student = userData ? JSON.parse(userData).student : null;
        
        // Create a leave request object
        const leaveRequest = {
          _id: 'local_' + Date.now(),
          student: {
            name: student?.name || 'Student',
            rollNo: student?.studentId || 'Unknown'
          },
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          eventName: formData.eventName || 'Leave Request',
          days: diffDays,
          status: 'pending',
          createdAt: new Date().toISOString(),
          department: student?.department || '',
          year: student?.year || '',
          section: student?.section || ''
        };
        
        // Get existing leave requests from localStorage
        const existingRequests = localStorage.getItem('leaveRequests');
        const requests = existingRequests ? JSON.parse(existingRequests) : [];
        
        // Add new request
        requests.push(leaveRequest);
        
        // Save back to localStorage
        localStorage.setItem('leaveRequests', JSON.stringify(requests));
        console.log('Leave request saved to localStorage:', leaveRequest);
        
        // Reset form and show success message if API call failed
        if (!submitStatus.success) {
          setFormData({
            leaveType: '',
            startDate: '',
            endDate: '',
            reason: '',
            eventName: ''
          });
          setFile(null);
          setFileName('');
          
          // Notify parent component
          if (onSubmitSuccess) onSubmitSuccess();
          
          // Show success message
          setSubmitStatus({ 
            success: true, 
            message: 'Leave request submitted successfully! (Saved to local storage)' 
          });
        }
      } catch (localStorageError) {
        console.error('LocalStorage Error:', localStorageError);
        
        // Only show error if both API and localStorage failed
        if (!submitStatus.success) {
          setSubmitStatus({
            success: false,
            message: 'Failed to submit leave request. Please try again later.'
          });
        }
      }
    } catch (err) {
      console.error('Error submitting leave request:', err);
      setSubmitStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to submit leave request. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusColor = (status) => {
    if (!verificationResult) return 'bg-gray-100 text-gray-800';
    
    const confidence = verificationResult.confidence || 0;
    
    if (verificationResult.verified && confidence > 80) {
      return 'bg-green-100 text-green-800';
    } else if (verificationResult.verified && confidence > 50) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitStatus.success && (
        <div className="bg-green-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{submitStatus.message}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error.message}</p>
            </div>
          </div>
        </div>
      )}
      
      {verificationResult && (
        <div className={`p-4 rounded-md mb-4 ${getStatusColor(verificationResult)}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {verificationResult.verified ? (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {verificationResult.verified 
                  ? `Event verified (${verificationResult.confidence}% confidence)` 
                  : `Verification issue (${verificationResult.confidence}% confidence)`}
              </p>
              <p className="text-xs mt-1">{verificationResult.reasoning}</p>
            </div>
          </div>
        </div>
      )}
      
      {blockchainHash && (
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Document verified on blockchain</p>
              <p className="text-xs text-blue-600 mt-1 font-mono break-all">{blockchainHash}</p>
            </div>
          </div>
        </div>
      )}
      
      {analyzing && (
        <div className="bg-indigo-50 p-4 rounded-md mb-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-indigo-700">Analyzing your document...</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-indigo-600 text-right">{uploadProgress}%</p>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Event Name</label>
        <input
          type="text"
          id="eventName"
          name="eventName"
          value={formData.eventName}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="e.g., College Technical Fest, Family Function, etc."
          required
        />
      </div>
      
      <div>
        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type</label>
        <select
          id="leaveType"
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          {leaveTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      
      <div className="text-sm">
        <span className="font-medium">Duration: </span>
        <span className="text-gray-700">{calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}</span>
      </div>
      
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          value={formData.reason}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Please provide details about your leave request..."
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Supporting Document</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a file</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 5MB</p>
            {fileName && (
              <p className="text-xs text-indigo-600 mt-2 truncate">
                Selected: {fileName}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={loading || analyzing || isSubmitting}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            loading || analyzing || isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading || analyzing || isSubmitting ? 'Processing...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
};

export default LeaveRequestForm; 