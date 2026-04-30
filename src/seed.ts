import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kiddo';

interface SeedData {
  familyName: string;
  parent: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  };
  children: Array<{
    username: string;
    password: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  }>;
  tasks: Array<{
    title: string;
    category: string;
    points: number;
    skillTag: string;
    requiresPhoto: boolean;
  }>;
  rewards: Array<{
    title: string;
    description: string;
    pointsCost: number;
    unlockedAtStreak?: number;
  }>;
}

const seedData: SeedData = {
  familyName: 'The Johnsons',
  parent: {
    email: 'parent@kiddo.app',
    password: 'parent123',
    firstName: 'Sarah',
    lastName: 'Johnson',
  },
  children: [
    {
      username: 'timmy',
      password: 'kid123',
      firstName: 'Timmy',
      avatar: 'space-ranger',
    },
    {
      username: 'emma',
      password: 'kid123',
      firstName: 'Emma',
      avatar: 'princess',
    },
  ],
  tasks: [
    { title: "Wake up on time", category: "Morning", points: 10, skillTag: "Discipline", requiresPhoto: false },
    { title: "Silent Prayer", category: "Morning", points: 5, skillTag: "Mindfulness", requiresPhoto: false },
    { title: "Smile in the mirror", category: "Morning", points: 5, skillTag: "Self-confidence", requiresPhoto: false },
    { title: "Make your bed", category: "Morning", points: 15, skillTag: "Responsibility", requiresPhoto: true },
    { title: "Wear uniform neatly", category: "Morning", points: 10, skillTag: "Self-care", requiresPhoto: true },
    { title: "Personal hygiene", category: "Morning", points: 10, skillTag: "Hygiene", requiresPhoto: false },
    { title: "Drink water", category: "Morning", points: 5, skillTag: "Health", requiresPhoto: false },
    { title: "Exercise (10-20 min)", category: "Morning", points: 20, skillTag: "Fitness", requiresPhoto: false },
    { title: "Prepare school bag", category: "Morning", points: 10, skillTag: "Organization", requiresPhoto: true },
    { title: "Greet teachers", category: "School", points: 10, skillTag: "Respect", requiresPhoto: false },
    { title: "Maintain discipline", category: "School", points: 10, skillTag: "Discipline", requiresPhoto: false },
    { title: "Help classmates", category: "School", points: 15, skillTag: "Empathy", requiresPhoto: false },
    { title: "No arguing", category: "School", points: 15, skillTag: "Emotional control", requiresPhoto: false },
    { title: "Keep classroom clean", category: "School", points: 15, skillTag: "Responsibility", requiresPhoto: false },
    { title: "Participate in class", category: "School", points: 15, skillTag: "Confidence", requiresPhoto: false },
    { title: "Wash hands", category: "After School", points: 10, skillTag: "Hygiene", requiresPhoto: false },
    { title: "Fold uniform", category: "After School", points: 15, skillTag: "Responsibility", requiresPhoto: true },
    { title: "Help parents", category: "After School", points: 20, skillTag: "Responsibility", requiresPhoto: false },
    { title: "Revise lessons", category: "After School", points: 20, skillTag: "Learning", requiresPhoto: false },
    { title: "Organize desk", category: "After School", points: 15, skillTag: "Organization", requiresPhoto: true },
    { title: "Complete homework", category: "After School", points: 30, skillTag: "Self-learning", requiresPhoto: true },
    { title: "Read for 20 mins", category: "After School", points: 20, skillTag: "Learning", requiresPhoto: false },
    { title: "Avoid screen time", category: "After School", points: 15, skillTag: "Discipline", requiresPhoto: false },
    { title: "Dinner with family", category: "Night", points: 10, skillTag: "Manners", requiresPhoto: false },
    { title: "Brush teeth", category: "Night", points: 10, skillTag: "Hygiene", requiresPhoto: true },
    { title: "Iron uniform", category: "Night", points: 20, skillTag: "Self-reliance", requiresPhoto: true },
    { title: "Make next day plan", category: "Night", points: 10, skillTag: "Time management", requiresPhoto: false },
    { title: "Pray before sleep", category: "Night", points: 10, skillTag: "Calmness", requiresPhoto: false },
    { title: "Sleep before 10 PM", category: "Night", points: 15, skillTag: "Health", requiresPhoto: false }
  ],
  rewards: [
    {
      title: '30 min screen time',
      description: 'Extra 30 minutes of video games or TV',
      pointsCost: 30,
    },
    {
      title: 'Stay up late',
      description: 'Stay up 30 minutes past bedtime',
      pointsCost: 50,
    },
    {
      title: 'Choose dinner',
      description: 'Pick what the family eats for dinner',
      pointsCost: 75,
    },
    {
      title: 'Movie night pick',
      description: 'Choose the movie for family movie night',
      pointsCost: 100,
    },
    {
      title: 'Trip to the toy store',
      description: 'Pick out a small toy (under $10)',
      pointsCost: 200,
      unlockedAtStreak: 7,
    },
    {
      title: 'Theme park day',
      description: 'Full day at the theme park',
      pointsCost: 500,
      unlockedAtStreak: 14,
    },
  ],
};

async function seed() {
  console.log('🔄 Connecting to MongoDB...');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to get database connection');
  }

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await db.collection('families').deleteMany({});
  await db.collection('users').deleteMany({});
  await db.collection('tasks').deleteMany({});
  await db.collection('rewards').deleteMany({});
  await db.collection('activities').deleteMany({});

  // Create Family
  console.log('👨‍👩‍👧‍👦 Creating family...');
  const familyResult = await db.collection('families').insertOne({
    name: seedData.familyName,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const familyId = familyResult.insertedId;
  console.log(`   Family: ${seedData.familyName}`);

  // Create Parent
  console.log('👤 Creating parent...');
  const hashedPassword = await bcrypt.hash(seedData.parent.password, 10);
  const parentResult = await db.collection('users').insertOne({
    familyId,
    role: 'parent',
    email: seedData.parent.email,
    password: hashedPassword,
    firstName: seedData.parent.firstName,
    lastName: seedData.parent.lastName,
    avatar: 'parent',
    points: 0,
    streak: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`   Parent: ${seedData.parent.email} / ${seedData.parent.password}`);

  // Create Children
  console.log('👶 Creating children...');
  const childIds: mongoose.Types.ObjectId[] = [];

  for (const child of seedData.children) {
    const childResult = await db.collection('users').insertOne({
      familyId,
      role: 'child',
      username: child.username,
      password: await bcrypt.hash(child.password, 10),
      firstName: child.firstName,
      lastName: child.lastName,
      avatar: child.avatar || 'default',
      points: Math.floor(Math.random() * 50), // Random starting points
      streak: Math.floor(Math.random() * 5), // Random starting streak
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    childIds.push(childResult.insertedId);
    console.log(`   Child: ${child.username} / ${child.password}`);
  }

  // Create Tasks for each child
  console.log('📋 Creating tasks...');
  for (let i = 0; i < seedData.tasks.length; i++) {
    const task = seedData.tasks[i];
    // Assign to first child
    await db.collection('tasks').insertOne({
      familyId,
      createdBy: parentResult.insertedId,
      assignedTo: childIds[i % childIds.length],
      title: task.title,
      description: `Routine task for ${task.category}`,
      category: task.category,
      points: task.points,
      skillTag: task.skillTag,
      requiresPhoto: task.requiresPhoto,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`   Task: ${task.title} (${task.points} pts)`);
  }

  // Create Rewards
  console.log('🎁 Creating rewards...');
  for (const reward of seedData.rewards) {
    await db.collection('rewards').insertOne({
      familyId,
      title: reward.title,
      description: reward.description,
      pointsCost: reward.pointsCost,
      unlockedAtStreak: reward.unlockedAtStreak || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`   Reward: ${reward.title} (${reward.pointsCost} pts)`);
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('📧 Login credentials:');
  console.log(`   Parent: ${seedData.parent.email} / ${seedData.parent.password}`);
  console.log(`   Child 1: ${seedData.children[0].username} / ${seedData.children[0].password}`);
  console.log(`   Child 2: ${seedData.children[1].username} / ${seedData.children[1].password}`);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (error) => {
  console.error('❌ Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});