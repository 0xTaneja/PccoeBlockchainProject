import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, subMonths, isValid } from 'date-fns';

const StudentAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch student profile
        const profileResponse = await axios.get('/api/auth/student/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setStudent(profileResponse.data.student);
        
        // Mock course data
        const mockCourses = [
          { _id: 'course1', name: 'Data Structures', code: 'CS201', teacher: 'Dr. John Smith' },
          { _id: 'course2', name: 'Algorithms', code: 'CS301', teacher: 'Dr. Emily Johnson' },
          { _id: 'course3', name: 'Machine Learning', code: 'CS401', teacher: 'Dr. Michael Lee' }
        ];
        
        setCourses(mockCourses);
        
        // Select first course by default
        if (mockCourses.length > 0) {
          setSelectedCourse(mockCourses[0]._id);
        }
        
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedCourse) return;
      
      try {
        setLoading(true);
        
        // Mock attendance data
        // In real app, this would be an API call with the selected course
        const mockAttendanceData = generateMockAttendance();
        
        setAttendance(mockAttendanceData);
        
        // Calculate stats
        const present = mockAttendanceData.filter(a => a.status === 'present').length;
        const total = mockAttendanceData.length;
        
        setAttendanceStats({
          present: present,
          absent: total - present,
          total: total,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0
        });
        
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendance();
  }, [selectedCourse]);

  // Generate mock attendance data for demo
  const generateMockAttendance = () => {
    const today = new Date();
    const data = [];
    
    // Generate attendance for last 3 months
    for (let i = 0; i < 40; i++) {
      const date = subMonths(today, Math.floor(i / 15));
      date.setDate(date.getDate() - (i % 15) * 2);
      
      // Randomly assign present/absent (80% present)
      const status = Math.random() < 0.8 ? 'present' : 'absent';
      
      data.push({
        date: date.toISOString(),
        status: status,
        topic: `Lecture ${40 - i}: ${getTopicByIndex(i, selectedCourse)}`
      });
    }
    
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Helper function to generate mock topics
  const getTopicByIndex = (index, courseId) => {
    const topics = {
      course1: [
        'Introduction to Data Structures',
        'Arrays and Linked Lists',
        'Stacks and Queues',
        'Trees',
        'Graphs',
        'Hash Tables'
      ],
      course2: [
        'Algorithm Analysis',
        'Sorting Algorithms',
        'Searching Algorithms',
        'Dynamic Programming',
        'Greedy Algorithms',
        'Graph Algorithms'
      ],
      course3: [
        'Introduction to Machine Learning',
        'Linear Regression',
        'Classification',
        'Neural Networks',
        'Deep Learning',
        'Reinforcement Learning'
      ]
    };
    
    const courseTopics = topics[courseId] || topics.course1;
    return courseTopics[index % courseTopics.length];
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  const getAttendanceColor = (status) => {
    return status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !student) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading attendance data...</p>
      </div>
    </div>;
  }
  
  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">My Attendance</h2>
      
      {/* Course Selector */}
      <div className="mb-6">
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
      
      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-indigo-700">Total Classes</h3>
          <p className="text-2xl font-bold text-indigo-800">{attendanceStats.total}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-700">Present</h3>
          <p className="text-2xl font-bold text-green-800">{attendanceStats.present}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-700">Absent</h3>
          <p className="text-2xl font-bold text-red-800">{attendanceStats.absent}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700">Attendance %</h3>
          <p className="text-2xl font-bold text-blue-800">{attendanceStats.percentage}%</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Attendance Rate</span>
          <span>{attendanceStats.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`${getProgressColor(attendanceStats.percentage)} h-2.5 rounded-full`}
            style={{ width: `${attendanceStats.percentage}%` }}
          ></div>
        </div>
        {attendanceStats.percentage < 75 && (
          <p className="text-red-500 text-xs mt-1">
            Warning: Your attendance is below 75%. Minimum requirement is 75%.
          </p>
        )}
      </div>
      
      {/* Attendance Records Table */}
      {loading ? (
        <div className="text-center py-4">Loading attendance records...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record, index) => {
                // Parse the date safely
                const date = isValid(parseISO(record.date)) 
                  ? format(parseISO(record.date), 'dd MMM yyyy')
                  : 'Invalid date';
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAttendanceColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.topic}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance; 