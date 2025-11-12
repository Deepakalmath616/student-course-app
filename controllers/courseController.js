const Course = require('../models/Course');
const User = require('../models/User');

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().lean();
    res.json(courses);
  } catch (err) {
    console.error('Get courses error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.registerCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) return res.status(400).json({ error: 'courseId required' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (course.students && course.students.includes(userId)) {
      return res.status(400).json({ error: 'Already registered for this course' });
    }

    course.students.push(userId);
    await course.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { courses: course._id } });

    res.json({ message: `Registered for ${course.title} successfully` });
  } catch (err) {
    console.error('Register course error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const courses = await Course.find({ students: userId }).lean();
    res.json(courses);
  } catch (err) {
    console.error('Get user courses error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
