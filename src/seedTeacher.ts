import { connectDatabase } from './config/database.js';
import { Teacher } from './models/teacher.model.js';
import { Class } from './models/class.model.js';
import { ClassStudent } from './models/class-student.model.js';
import { User } from './models/user.model.js';

async function seedTeachers() {
  await connectDatabase();

  const existing = await Teacher.countDocuments();
  if (existing > 0) {
    console.log(`Teachers already exist (${existing}), skipping seed.`);
    process.exit(0);
  }

  const sampleTeachers = [
    { teacherCode: 'KD-TR-5839', fullName: 'Sarah Johnson', email: 'sarah.johnson@school.com', phone: '555-0101', schoolName: 'Sunrise Elementary', status: 'pending' },
    { teacherCode: 'KD-TR-7842', fullName: 'Michael Chen', email: 'michael.chen@school.com', phone: '555-0102', schoolName: 'Sunrise Elementary', status: 'pending' },
    { teacherCode: 'KD-TR-9215', fullName: 'Priya Sharma', email: 'priya.sharma@school.com', phone: '555-0103', schoolName: 'Green Valley Academy', status: 'pending' },
    { teacherCode: 'KD-TR-4471', fullName: 'James Wilson', email: 'james.wilson@school.com', phone: '555-0104', schoolName: 'Green Valley Academy', status: 'active' },
    { teacherCode: 'KD-TR-6638', fullName: 'Emily Davis', email: 'emily.davis@school.com', phone: '555-0105', schoolName: 'Riverside Public School', status: 'active' },
  ];

  const teachers = await Teacher.insertMany(sampleTeachers);
  console.log(`✅ Created ${teachers.length} sample teachers`);

  const sampleClasses = [
    { teacherId: teachers[3]._id, className: 'Class 5A', grade: 5, classCode: 'CLS-8X92K', description: 'Grade 5 Section A' },
    { teacherId: teachers[3]._id, className: 'Class 5B', grade: 5, classCode: 'CLS-7Y31L', description: 'Grade 5 Section B' },
    { teacherId: teachers[4]._id, className: 'Class 3A', grade: 3, classCode: 'CLS-4P56M', description: 'Grade 3 Section A' },
    { teacherId: teachers[4]._id, className: 'Class 3B', grade: 3, classCode: 'CLS-9Q78N', description: 'Grade 3 Section B' },
  ];

  const classes = await Class.insertMany(sampleClasses);
  console.log(`✅ Created ${classes.length} sample classes`);

  const children = await User.find({ role: 'child' }).limit(10).lean();
  if (children.length > 0) {
    const mappings = [];
    for (let i = 0; i < children.length; i++) {
      const classIdx = i % classes.length;
      mappings.push({
        classId: classes[classIdx]._id,
        childId: children[i]._id,
        status: 'active',
      });
    }
    await ClassStudent.insertMany(mappings);
    console.log(`✅ Mapped ${mappings.length} students to classes`);

    for (const cls of classes) {
      const count = await ClassStudent.countDocuments({ classId: cls._id, status: 'active' });
      await Class.findByIdAndUpdate(cls._id, { totalStudents: count });
    }
    console.log(`✅ Updated class student counts`);
  } else {
    console.log('⚠️  No children found in database. Create children first, then re-run this seed.');
  }

  console.log('\n📋 Sample Teacher Credentials:');
  console.log('  Teacher Code: KD-TR-4471 (James Wilson - needs activation, then login)');
  console.log('  Teacher Code: KD-TR-6638 (Emily Davis - needs activation, then login)');
  console.log('  Email: james.wilson@school.com');
  console.log('  Email: emily.davis@school.com');

  process.exit(0);
}

seedTeachers().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
