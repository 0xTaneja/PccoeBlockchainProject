import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TeacherCourses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    upcomingClasses: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch teacher profile
        const profileResponse = await axios.get('/api/auth/teacher/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTeacher(profileResponse.data.teacher);
        
        // In a real app, you would fetch courses from API
        // For demo, we'll use mock data
        const mockCourses = [
          { 
            _id: 'course1', 
            name: 'Data Structures', 
            code: 'CS201', 
            year: 2, 
            section: 'A',
            schedule: 'Mon, Wed 10:00 - 11:30 AM',
            classroom: 'Room 301',
            students: 45,
            syllabus: 'https://example.com/syllabus/cs201',
            progress: 65
          },
          { 
            _id: 'course2', 
            name: 'Algorithms', 
            code: 'CS301', 
            year: 3, 
            section: 'B',
            schedule: 'Tue, Thu 1:00 - 2:30 PM',
            classroom: 'Room 405',
            students: 38,
            syllabus: 'https://example.com/syllabus/cs301',
            progress: 42
          },
          { 
            _id: 'course3', 
            name: 'Machine Learning', 
            code: 'CS401', 
            year: 4, 
            section: 'A',
            schedule: 'Fri 9:00 - 12:00 PM',
            classroom: 'Lab 201',
            students: 25,
            syllabus: 'https://example.com/syllabus/cs401',
            progress: 30
          }
        ];
        
        setCourses(mockCourses);
        
        // Calculate stats
        setStats({
          totalCourses: mockCourses.length,
          totalStudents: mockCourses.reduce((sum, course) => sum + course.students, 0),
          upcomingClasses: 5 // Just a mock value
        });
        
      } catch (err) {
        console.error('Error fetching teacher data:', err);
        setError('Failed to load teacher data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading courses...</p>
      </div>
    </div>;
  }
  
  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">My Courses</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700">Total Courses</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.totalCourses}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-700">Total Students</h3>
          <p className="text-2xl font-bold text-purple-800">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-amber-700">Upcoming Classes</h3>
          <p className="text-2xl font-bold text-amber-800">{stats.upcomingClasses}</p>
        </div>
      </div>
      
      {/* Course List */}
      <div className="space-y-4">
        {courses.map(course => (
          <div key={course._id} className="border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-md">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h3 className="font-medium text-lg text-gray-900">{course.name}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  {course.code} • Year {course.year}, Section {course.section}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {course.schedule} • {course.classroom}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {course.students} Students
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {course.progress}% Complete
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-2">
                <Link
                  to={`/teacher/attendance?course=${course._id}`}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Attendance
                </Link>
                <a
                  href={course.syllabus}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                >
                  Syllabus
                </a>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Course Progress</span>
                <span>{course.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherCourses; 