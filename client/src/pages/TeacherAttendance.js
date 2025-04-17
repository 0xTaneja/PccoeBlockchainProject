import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const TeacherAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0
  });
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch teacher profile
        const profileResponse = await axios.get('/api/auth/teacher/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTeacher(profileResponse.data.teacher);
        
        // Mock courses data
        const mockCourses = [
          { 
            _id: 'course1', 
            name: 'Data Structures', 
            code: 'CS201', 
            semester: 3,
            department: 'Computer Science',
            schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
            classroom: 'Room 301'
          },
          { 
            _id: 'course2', 
            name: 'Algorithms', 
            code: 'CS301', 
            semester: 5,
            department: 'Computer Science',
            schedule: 'Tue, Thu 1:00 PM - 2:30 PM',
            classroom: 'Room 205'
          },
          { 
            _id: 'course3', 
            name: 'Machine Learning', 
            code: 'CS401', 
            semester: 7,
            department: 'Computer Science',
            schedule: 'Fri 9:00 AM - 12:00 PM',
            classroom: 'Lab 102'
          }
        ];
        
        setCourses(mockCourses);
        
        // Select first course by default
        if (mockCourses.length > 0) {
          setSelectedCourse(mockCourses[0]._id);
        }
        
      } catch (err) {
        console.error('Error fetching teacher data:', err);
        setError('Failed to load teacher data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsForCourse();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse && date) {
      checkExistingAttendance();
    }
  }, [selectedCourse, date]);

  const fetchStudentsForCourse = async () => {
    try {
      setLoading(true);
      // Mock students data
      const mockStudents = Array.from({ length: 25 }, (_, i) => ({
        _id: `student${i+1}`,
        name: `Student ${i+1}`,
        rollNo: `CS${2023}${i+1 < 10 ? '0' + (i+1) : i+1}`,
        email: `student${i+1}@example.com`
      }));

      setStudents(mockStudents);
      
      // Initialize attendance records for all students
      const initialRecords = mockStudents.map(student => ({
        studentId: student._id,
        studentName: student.name,
        rollNo: student.rollNo,
        status: 'pending', // 'present', 'absent' or 'pending'
      }));
      
      setAttendanceRecords(initialRecords);
      
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students for this course');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAttendance = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call to check if attendance has been taken
      // for this course on this date
      
      // Mock check - randomly decide if attendance was already taken
      const wasAttendanceTaken = Math.random() > 0.7;
      
      if (wasAttendanceTaken) {
        // Mock existing attendance data
        const existingAttendance = students.map(student => ({
          studentId: student._id,
          studentName: student.name,
          rollNo: student.rollNo,
          status: Math.random() > 0.2 ? 'present' : 'absent',
        }));
        
        setAttendanceRecords(existingAttendance);
        setAttendanceSubmitted(true);
        
        // Calculate stats
        const presentCount = existingAttendance.filter(record => record.status === 'present').length;
        setAttendanceStats({
          present: presentCount,
          absent: existingAttendance.length - presentCount,
          total: existingAttendance.length
        });
      } else {
        setAttendanceSubmitted(false);
      }
      
    } catch (err) {
      console.error('Error checking existing attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setAttendanceSubmitted(false);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setAttendanceSubmitted(false);
  };

  const handleAttendanceChange = (studentId, status) => {
    if (attendanceSubmitted) return;
    
    const updatedRecords = attendanceRecords.map(record => 
      record.studentId === studentId ? { ...record, status } : record
    );
    
    setAttendanceRecords(updatedRecords);
  };

  const markAllAs = (status) => {
    if (attendanceSubmitted) return;
    
    const updatedRecords = attendanceRecords.map(record => ({
      ...record,
      status
    }));
    
    setAttendanceRecords(updatedRecords);
  };

  const submitAttendance = async () => {
    try {
      setSavingAttendance(true);
      
      // Check if all students have been marked
      const pendingRecords = attendanceRecords.filter(record => record.status === 'pending');
      if (pendingRecords.length > 0) {
        alert(`Please mark attendance for all ${pendingRecords.length} remaining students`);
        setSavingAttendance(false);
        return;
      }
      
      // In a real app, this would be an API call to save the attendance
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate attendance stats
      const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
      setAttendanceStats({
        present: presentCount,
        absent: attendanceRecords.length - presentCount,
        total: attendanceRecords.length
      });
      
      setAttendanceSubmitted(true);
      
      // Show success message
      alert('Attendance submitted successfully');
      
    } catch (err) {
      console.error('Error submitting attendance:', err);
      alert('Failed to submit attendance. Please try again.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const reopenAttendance = () => {
    setAttendanceSubmitted(false);
  };

  if (loading && !teacher) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
  }

  const getSelectedCourseDetails = () => {
    return courses.find(course => course._id === selectedCourse) || {};
  };

  const courseDetails = getSelectedCourseDetails();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Manage Class Attendance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Course Selector */}
        <div>
          <label htmlFor="courseSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Course
          </label>
          <select
            id="courseSelect"
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedCourse || ''}
            onChange={handleCourseChange}
          >
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Date Selector */}
        <div>
          <label htmlFor="dateSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            id="dateSelect"
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={date}
            onChange={handleDateChange}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
      </div>
      
      {/* Course Details */}
      {courseDetails && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">{courseDetails.name} ({courseDetails.code})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="text-gray-600">Department:</span> {courseDetails.department}</p>
              <p><span className="text-gray-600">Semester:</span> {courseDetails.semester}</p>
            </div>
            <div>
              <p><span className="text-gray-600">Schedule:</span> {courseDetails.schedule}</p>
              <p><span className="text-gray-600">Classroom:</span> {courseDetails.classroom}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Attendance Stats (when submitted) */}
      {attendanceSubmitted && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700">Present</h3>
            <p className="text-2xl font-bold text-green-800">{attendanceStats.present}</p>
            <p className="text-sm text-green-600">
              ({Math.round((attendanceStats.present / attendanceStats.total) * 100)}%)
            </p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-700">Absent</h3>
            <p className="text-2xl font-bold text-red-800">{attendanceStats.absent}</p>
            <p className="text-sm text-red-600">
              ({Math.round((attendanceStats.absent / attendanceStats.total) * 100)}%)
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700">Total Students</h3>
            <p className="text-2xl font-bold text-blue-800">{attendanceStats.total}</p>
          </div>
        </div>
      )}
      
      {/* Attendance Actions */}
      {!attendanceSubmitted ? (
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            onClick={() => markAllAs('present')}
          >
            Mark All Present
          </button>
          <button 
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={() => markAllAs('absent')}
          >
            Mark All Absent
          </button>
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded ml-auto"
            onClick={submitAttendance}
            disabled={savingAttendance}
          >
            {savingAttendance ? 'Saving...' : 'Submit Attendance'}
          </button>
        </div>
      ) : (
        <div className="flex justify-end mb-6">
          <button 
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
            onClick={reopenAttendance}
          >
            Reopen Attendance
          </button>
        </div>
      )}
      
      {/* Students Attendance Table */}
      {loading ? (
        <div className="text-center py-4">Loading students...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.map((record) => (
                <tr key={record.studentId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.rollNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {attendanceSubmitted ? (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    ) : (
                      <div className="flex justify-center space-x-2">
                        <button
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            record.status === 'present' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                          }`}
                          onClick={() => handleAttendanceChange(record.studentId, 'present')}
                        >
                          Present
                        </button>
                        <button
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            record.status === 'absent' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                          }`}
                          onClick={() => handleAttendanceChange(record.studentId, 'absent')}
                        >
                          Absent
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance; 