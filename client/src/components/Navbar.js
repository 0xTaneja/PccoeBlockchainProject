import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const isStudent = user && user.student;
  const username = isStudent ? user.student.name : user.teacher.name;
  const dashboardPath = isStudent ? '/student' : '/teacher';
  
  return (
    <nav className="bg-blue-800 text-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={dashboardPath} className="flex items-center font-bold text-xl">
              PCCOE ERP
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to={dashboardPath} className="px-3 py-2 hover:bg-blue-700 rounded">
              Dashboard
            </Link>
            {isStudent ? (
              <>
                <Link to="/student/attendance" className="px-3 py-2 hover:bg-blue-700 rounded">
                  Attendance
                </Link>
                <Link to="/student/leave" className="px-3 py-2 hover:bg-blue-700 rounded">
                  Leave Requests
                </Link>
              </>
            ) : (
              <>
                <Link to="/teacher/courses" className="px-3 py-2 hover:bg-blue-700 rounded">
                  Courses
                </Link>
                <Link to="/teacher/attendance" className="px-3 py-2 hover:bg-blue-700 rounded">
                  Attendance
                </Link>
              </>
            )}
            
            {/* User dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span className="ml-2">{username}</span>
                </button>
              </div>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={() => {
                      onLogout();
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to={dashboardPath}
              className="block px-3 py-2 hover:bg-blue-700 rounded"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            {isStudent ? (
              <>
                <Link
                  to="/student/attendance"
                  className="block px-3 py-2 hover:bg-blue-700 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Attendance
                </Link>
                <Link
                  to="/student/leave"
                  className="block px-3 py-2 hover:bg-blue-700 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Leave Requests
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/teacher/courses"
                  className="block px-3 py-2 hover:bg-blue-700 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Courses
                </Link>
                <Link
                  to="/teacher/attendance"
                  className="block px-3 py-2 hover:bg-blue-700 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Attendance
                </Link>
              </>
            )}
            <Link
              to="/profile"
              className="block px-3 py-2 hover:bg-blue-700 rounded"
              onClick={() => setIsOpen(false)}
            >
              Your Profile
            </Link>
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-blue-700 rounded"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 