import express from 'express';
import { db } from '../firebase-admin.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const allowedLanguages = new Set(['English', 'Sinhala', 'Tamil']);
const allowedDifficulties = new Set(['Easy', 'Medium', 'Hard']);

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { subject, grade, language, difficulty, question, options, correct, hint } = body;

  if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 80) {
    return res.status(400).json({ error: 'subject must be a non-empty string of at most 80 characters.' });
  }
  if (typeof grade !== 'string' || !/^Grade [1-5]$/.test(grade)) {
    return res.status(400).json({ error: 'grade must be Grade 1 through Grade 5.' });
  }
  if (typeof language !== 'string' || !allowedLanguages.has(language)) {
    return res.status(400).json({ error: 'language must be English, Sinhala, or Tamil.' });
  }
  if (typeof difficulty !== 'string' || !allowedDifficulties.has(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be Easy, Medium, or Hard.' });
  }
  if (typeof question !== 'string' || !question.trim() || question.trim().length > 1000) {
    return res.status(400).json({ error: 'question must be a non-empty string of at most 1000 characters.' });
  }
  if (!Array.isArray(options) || options.length < 2 || options.length > 6
    || options.some(option => typeof option !== 'string' || !option.trim() || option.length > 300)) {
    return res.status(400).json({ error: 'options must contain 2 to 6 non-empty strings of at most 300 characters.' });
  }
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
    return res.status(400).json({ error: 'correct must be the zero-based index of an answer option.' });
  }
  if (hint !== undefined && (typeof hint !== 'string' || hint.length > 500)) {
    return res.status(400).json({ error: 'hint must be a string of at most 500 characters.' });
  }

  const quizQuestion = {
    subject: subject.trim(),
    grade,
    language,
    difficulty,
    question: question.trim(),
    options: options.map(option => option.trim()),
    correct,
    ...(typeof hint === 'string' && hint.trim() ? { hint: hint.trim() } : {}),
    createdAt: new Date().toISOString(),
    createdBy: req.user.uid,
  };

  try {
    const document = await db.collection('quiz_questions').add(quizQuestion);
    return res.status(201).json({ id: document.id, ...quizQuestion });
  } catch (error) {
    return next(error);
  }
});

export default router;