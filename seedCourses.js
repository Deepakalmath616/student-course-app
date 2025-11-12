require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected — seeding courses...');

  await Course.deleteMany({});
  await Course.insertMany([
    {
      title: 'Full Stack Web Development',
      instructor: 'John Doe',
      duration: '12',
      description: 'HTML, CSS, JavaScript, Node.js and MongoDB.'
    },
    {
      title: 'Data Science & Machine Learning',
      instructor: 'Jane Smith',
      duration: '10',
      description: 'Python, pandas, ML basics, model building.'
    },
    {
      title: 'Cloud Computing with AWS',
      instructor: 'David Brown',
      duration: '8',
      description: 'Cloud fundamentals, EC2, S3, Lambda.'
    },
    {
      title: 'Cyber Security Fundamentals',
      instructor: 'Emily Johnson',
      duration: '6',
      description: 'Security basics, authentication, best practices.'
    }
  ]);
  console.log('✅ Courses seeded');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
