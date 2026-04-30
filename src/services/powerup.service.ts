import { StatusCodes } from 'http-status-codes';
import { Activity } from '../models/activity.model.js';
import { PowerupLog } from '../models/powerup.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FOCUS_TIMER_POINTS = 8;
const BRAIN_BREAK_POINTS = 3;
const KNOWLEDGE_QUEST_CORRECT_POINTS = 10;
const KNOWLEDGE_QUEST_WRONG_POINTS = 2; // participation reward

/** Simple question bank — extend or move to DB later. */
export const QUESTION_BANK = [
  { id: 1, question: 'What is the capital of France?',       answer: 'Paris',       options: ['Paris', 'London', 'Berlin', 'Madrid'] },
  { id: 2, question: 'What planet is known as the Red Planet?', answer: 'Mars',     options: ['Venus', 'Mars', 'Jupiter', 'Saturn'] },
  { id: 3, question: 'How many continents are there?',       answer: '7',           options: ['5', '6', '7', '8'] },
  { id: 4, question: 'What gas do plants absorb?',           answer: 'Carbon Dioxide', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'] },
  { id: 5, question: 'Who painted the Mona Lisa?',           answer: 'Leonardo da Vinci', options: ['Picasso', 'Michelangelo', 'Leonardo da Vinci', 'Rembrandt'] },
  { id: 6, question: 'What is H₂O commonly known as?',      answer: 'Water',       options: ['Water', 'Salt', 'Acid', 'Sugar'] },
  { id: 7, question: 'How many legs does a spider have?',    answer: '8',           options: ['6', '8', '10', '12'] },
  { id: 8, question: 'Which ocean is the largest?',          answer: 'Pacific',     options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'] },
];

/** Mindfulness tip pool served by GET /powerups/brain-break. */
export const BRAIN_BREAK_TIPS = [
  'Take 5 slow, deep breaths — in through your nose, out through your mouth.',
  'Stand up and stretch your arms above your head for 10 seconds.',
  'Close your eyes and imagine your favourite place for 30 seconds.',
  'Roll your shoulders forward 5 times, then backward 5 times.',
  'Do 10 jumping jacks to get your energy up!',
  'Give yourself a big hug and say "I am doing great!"',
];

/* ------------------------------------------------------------------ */
/*  Focus Timer                                                        */
/* ------------------------------------------------------------------ */

export async function completeFocusSession(
  userId: string,
  familyId: string | undefined,
  durationSeconds: number,
) {
  const user = await User.findOne({ _id: userId, familyId, role: 'child' });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Child user not found');

  user.points = (user.points ?? 0) + FOCUS_TIMER_POINTS;
  await user.save();

  const log = await PowerupLog.create({
    familyId,
    userId,
    type: 'focus_timer',
    durationSeconds,
    pointsAwarded: FOCUS_TIMER_POINTS,
  });

  await Activity.create({
    familyId,
    actorId: userId,
    type: 'powerup_completed',
    message: `${user.firstName} completed a ${Math.round(durationSeconds / 60)}-min focus session`,
    metadata: { powerup: 'focus_timer', durationSeconds, pointsAwarded: FOCUS_TIMER_POINTS },
  });

  return {
    pointsAwarded: FOCUS_TIMER_POINTS,
    totalPoints: user.points,
    logId: log._id,
  };
}

/* ------------------------------------------------------------------ */
/*  Brain Break                                                        */
/* ------------------------------------------------------------------ */

export function getRandomBrainBreakTip() {
  return BRAIN_BREAK_TIPS[Math.floor(Math.random() * BRAIN_BREAK_TIPS.length)];
}

export async function completeBrainBreak(
  userId: string,
  familyId: string | undefined,
) {
  const user = await User.findOne({ _id: userId, familyId, role: 'child' });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Child user not found');

  user.points = (user.points ?? 0) + BRAIN_BREAK_POINTS;
  await user.save();

  const log = await PowerupLog.create({
    familyId,
    userId,
    type: 'brain_break',
    pointsAwarded: BRAIN_BREAK_POINTS,
  });

  await Activity.create({
    familyId,
    actorId: userId,
    type: 'powerup_completed',
    message: `${user.firstName} took a brain break 🧘`,
    metadata: { powerup: 'brain_break', pointsAwarded: BRAIN_BREAK_POINTS },
  });

  return {
    pointsAwarded: BRAIN_BREAK_POINTS,
    totalPoints: user.points,
    logId: log._id,
  };
}

/* ------------------------------------------------------------------ */
/*  Knowledge Quest                                                    */
/* ------------------------------------------------------------------ */

export function getRandomQuestion() {
  const q = QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
  // Don't leak the answer in the GET response
  return { id: q.id, question: q.question, options: q.options };
}

export async function answerQuestion(
  userId: string,
  familyId: string | undefined,
  questionId: number,
  answer: string,
) {
  const user = await User.findOne({ _id: userId, familyId, role: 'child' });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Child user not found');

  const q = QUESTION_BANK.find((item) => item.id === questionId);
  if (!q) throw new ApiError(StatusCodes.NOT_FOUND, 'Question not found');

  const correct = q.answer.toLowerCase() === answer.trim().toLowerCase();
  const pts = correct ? KNOWLEDGE_QUEST_CORRECT_POINTS : KNOWLEDGE_QUEST_WRONG_POINTS;

  user.points = (user.points ?? 0) + pts;
  await user.save();

  const log = await PowerupLog.create({
    familyId,
    userId,
    type: 'knowledge_quest',
    questionId,
    answer,
    correct,
    pointsAwarded: pts,
  });

  await Activity.create({
    familyId,
    actorId: userId,
    type: 'powerup_completed',
    message: `${user.firstName} answered a Knowledge Quest ${correct ? 'correctly ✅' : '❌'}`,
    metadata: { powerup: 'knowledge_quest', questionId, correct, pointsAwarded: pts },
  });

  return {
    correct,
    correctAnswer: q.answer,
    pointsAwarded: pts,
    totalPoints: user.points,
    logId: log._id,
  };
}
