const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const config = require('../config');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Delete all existing data
const clearDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
};

// Create sample students
const createStudents = async () => {
  try {
    const departments = ['Computer Engineering', 'IT', 'Mechanical', 'Civil', 'Electronics'];
    const years = [1, 2, 3, 4];
    const divisions = ['A', 'B', 'C'];
    
    const students = [];
    
    for (let i = 1; i <= 80; i++) {
      const studentId = `PCCOE2023${i.toString().padStart(3, '0')}`;
      const department = departments[Math.floor(Math.random() * departments.length)];
      const year = years[Math.floor(Math.random() * years.length)];
      const division = divisions[Math.floor(Math.random() * divisions.length)];
      
      const student = new Student({
        studentId,
        name: `Student ${i}`,
        email: `student${i}@pccoe.edu.in`,
        password: 'password123',
        department,
        year,
        division,
        rollNumber: i,
        mobileNumber: `98765${43210 + i}`
      });
      
      // Save each student individually to trigger the password hashing middleware
      await student.save();
      students.push(student);
    }
    
    console.log(`${students.length} students created successfully`);
    return students;
  } catch (error) {
    console.error('Error creating students:', error.message);
    process.exit(1);
  }
};

// Create sample teachers
const createTeachers = async () => {
  try {
    const departments = ['Computer Engineering', 'IT', 'Mechanical', 'Civil', 'Electronics'];
    const designations = ['Assistant Professor', 'Associate Professor', 'Professor', 'Head of Department'];
    const divisions = ['A', 'B', 'C'];
    
    const teachers = [];
    
    // Create regular teachers
    for (let i = 1; i <= 20; i++) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      const designation = designations[Math.floor(Math.random() * 3)]; // No HOD for regular teachers
      
      const teacher = new Teacher({
        employeeId: `EMP${1000 + i}`,
        name: `Teacher ${i}`,
        email: `teacher${i}@pccoe.edu.in`,
        password: 'password123',
        department,
        designation,
        mobileNumber: `98765${10000 + i}`,
        isClassTeacher: false,
        isHod: false
      });
      
      // Save each teacher individually to trigger the password hashing middleware
      await teacher.save();
      teachers.push(teacher);
    }
    
    // Create class teachers
    for (let i = 1; i <= divisions.length; i++) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      const designation = designations[Math.floor(Math.random() * 3)];
      const division = divisions[i - 1];
      
      const teacher = new Teacher({
        employeeId: `EMP${2000 + i}`,
        name: `ClassTeacher ${i}`,
        email: `classteacher${i}@pccoe.edu.in`,
        password: 'password123',
        department,
        designation,
        mobileNumber: `98765${20000 + i}`,
        isClassTeacher: true,
        classDivision: division,
        isHod: false
      });
      
      // Save each teacher individually
      await teacher.save();
      teachers.push(teacher);
    }
    
    // Create HODs
    for (let i = 0; i < departments.length; i++) {
      const department = departments[i];
      
      const teacher = new Teacher({
        employeeId: `EMP${3000 + i}`,
        name: `HOD ${department}`,
        email: `hod.${department.toLowerCase().replace(/\s+/g, '')}@pccoe.edu.in`,
        password: 'password123',
        department,
        designation: 'Head of Department',
        mobileNumber: `98765${30000 + i}`,
        isClassTeacher: false,
        isHod: true
      });
      
      // Save each teacher individually
      await teacher.save();
      teachers.push(teacher);
    }
    
    console.log(`${teachers.length} teachers created successfully`);
    return teachers;
  } catch (error) {
    console.error('Error creating teachers:', error.message);
    process.exit(1);
  }
};

// Create sample courses
const createCourses = async (students, teachers) => {
  try {
    const courses = [];
    const courseNames = [
      'Data Structures and Algorithms',
      'Object Oriented Programming',
      'Database Management Systems',
      'Computer Networks',
      'Operating Systems',
      'Software Engineering',
      'Web Development',
      'Artificial Intelligence',
      'Machine Learning',
      'Cloud Computing',
      'Big Data Analytics',
      'Cyber Security',
      'Mobile Computing',
      'Internet of Things',
      'Embedded Systems'
    ];
    
    const departments = ['Computer Engineering', 'IT', 'Mechanical', 'Civil', 'Electronics'];
    
    for (let i = 0; i < courseNames.length; i++) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      const year = Math.floor(Math.random() * 4) + 1;
      const semester = year * 2 - Math.floor(Math.random() * 2);
      
      // Assign teachers to the course
      const courseTeachers = teachers
        .filter(teacher => teacher.department === department)
        .slice(0, 2)
        .map(teacher => teacher._id);
      
      // Assign students to the course
      const courseStudents = students
        .filter(student => student.department === department && student.year === year)
        .map(student => student._id);
      
      const course = new Course({
        courseCode: `${department.substring(0, 3).toUpperCase()}${100 + i}`,
        name: courseNames[i],
        department,
        credits: Math.floor(Math.random() * 3) + 2,
        year,
        semester,
        teachers: courseTeachers,
        students: courseStudents
      });
      
      courses.push(course);
    }
    
    await Course.insertMany(courses);
    console.log(`${courses.length} courses created successfully`);
    
    // Update teachers with courses
    for (const course of courses) {
      await Teacher.updateMany(
        { _id: { $in: course.teachers } },
        { $push: { courses: course._id } }
      );
    }
    console.log('Teachers updated with courses');
    
    return courses;
  } catch (error) {
    console.error('Error creating courses:', error.message);
    process.exit(1);
  }
};

// Main function to seed data
const seedData = async () => {
  try {
    await connectDB();
    await clearDB();
    
    console.log('Seeding database...');
    const students = await createStudents();
    const teachers = await createTeachers();
    const courses = await createCourses(students, teachers);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedData(); 