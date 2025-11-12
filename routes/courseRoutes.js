const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCourses, registerCourse, getUserCourses } = require('../controllers/courseController');

router.get('/', getCourses);
router.post('/register', auth, registerCourse);
router.get('/mycourses', auth, getUserCourses);

module.exports = router;
