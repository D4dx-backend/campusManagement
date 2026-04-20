import express from 'express';
import multer from 'multer';
import path from 'path';
import { Types } from 'mongoose';
import { Chapter } from '../models/Chapter';
import { LessonContent } from '../models/LessonContent';
import { LmsAssessment } from '../models/LmsAssessment';
import { StudentSubmission } from '../models/StudentSubmission';
import { ClassContentAssignment } from '../models/ClassContentAssignment';
import { ContentProgress } from '../models/ContentProgress';
import { Student } from '../models/Student';
import { Division } from '../models/Division';
import { Subject } from '../models/Subject';
import { ActivityLog } from '../models/ActivityLog';
import { QuestionPool } from '../models/QuestionPool';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';
import { doSpacesService } from '../services/doSpacesService';

const router = express.Router();
router.use(authenticate);

/**
 * LMS-specific filter: branch-level users also see org-level content (branchId=null).
 * This wraps getOrgBranchFilter and converts strict branchId to $in for read queries.
 */
function getLmsReadFilter(req: AuthenticatedRequest): Record<string, any> {
  const base = getOrgBranchFilter(req);
  // If base has a specific branchId (branch-level user), also include org-level content
  if (base.branchId && !(base.branchId.$in)) {
    base.branchId = { $in: [base.branchId, null] };
  }
  return base;
}

// ── Multer config for content file uploads ──
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|webm|ogg|mp3|wav/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowedTypes.test(ext)) {
      return cb(null, true);
    }
    cb(new Error('File type not allowed. Supported: images, PDF, Office docs, videos, audio'));
  }
});

// ══════════════════════════════════════════════════════════════════════
// CHAPTER ROUTES
// ══════════════════════════════════════════════════════════════════════

const chapterCreateSchema = Joi.object({
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  name: Joi.string().required().trim(),
  chapterNumber: Joi.number().integer().min(1).required(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').default('active'),
  branchId: Joi.string().optional()
});

const chapterUpdateSchema = Joi.object({
  name: Joi.string().optional().trim(),
  chapterNumber: Joi.number().integer().min(1).optional(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  branchId: Joi.string().optional().allow('')
});

const chapterQuerySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/).custom(v => Math.min(parseInt(v, 10), 100))).default(50),
  search: Joi.string().optional().allow(''),
  subjectId: Joi.string().optional().allow(''),
  classId: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('chapterNumber', 'name', 'createdAt').default('chapterNumber'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  branchId: Joi.string().optional().allow('')
});

// GET /api/lms/chapters
router.get('/chapters', checkPermission('classes', 'read'), validateQuery(chapterQuerySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 50, search = '', subjectId = '', classId = '', status = '', sortBy = 'chapterNumber', sortOrder = 'asc' } = req.query as QueryParams;
  const filter: any = {};
  Object.assign(filter, getLmsReadFilter(req));
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (subjectId && Types.ObjectId.isValid(subjectId)) filter.subjectId = new Types.ObjectId(subjectId);
  if (classId && Types.ObjectId.isValid(classId)) filter.classId = new Types.ObjectId(classId);
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    Chapter.find(filter).sort(sortOptions).skip(skip).limit(Number(limit))
      .populate('subjectId', 'name code')
      .populate('classId', 'name'),
    Chapter.countDocuments(filter)
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Chapters fetched',
    data,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  };
  res.json(response);
});

// GET /api/lms/chapters/:id
router.get('/chapters/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getLmsReadFilter(req));
  const chapter = await Chapter.findOne(filter)
    .populate('subjectId', 'name code')
    .populate('classId', 'name');
  if (!chapter) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: chapter });
});

// POST /api/lms/chapters
router.post('/chapters', checkPermission('classes', 'create'), validate(chapterCreateSchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const chapter = await Chapter.create({ ...req.body, createdBy: req.user!._id, ...orgBranch });

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'create',
    module: 'lms',
    details: `Created chapter: ${chapter.name}`,
    ...orgBranch
  });

  res.status(201).json({ success: true, message: 'Chapter created', data: chapter });
});

// PUT /api/lms/chapters/:id
router.put('/chapters/:id', checkPermission('classes', 'update'), validate(chapterUpdateSchema), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const chapter = await Chapter.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!chapter) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Chapter updated', data: chapter });
});

// DELETE /api/lms/chapters/:id
router.delete('/chapters/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const chapter = await Chapter.findOneAndDelete(filter);
  if (!chapter) return res.status(404).json({ success: false, message: 'Not found' });

  // Also delete all lesson content under this chapter
  await LessonContent.deleteMany({ chapterId: chapter._id, ...getOrgBranchFilter(req) });

  res.json({ success: true, message: 'Chapter deleted' });
});

// PUT /api/lms/chapters/reorder
router.put('/chapters-reorder', checkPermission('classes', 'update'), async (req: AuthenticatedRequest, res) => {
  const { items } = req.body; // [{ _id, chapterNumber }]
  if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items array required' });

  const orgBranch = getOrgBranchFilter(req);
  const ops = items.map((item: { _id: string; chapterNumber: number }) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(item._id), ...orgBranch },
      update: { $set: { chapterNumber: item.chapterNumber } }
    }
  }));
  await Chapter.bulkWrite(ops);
  res.json({ success: true, message: 'Chapters reordered' });
});

// ══════════════════════════════════════════════════════════════════════
// CONTENT (LESSON) ROUTES
// ══════════════════════════════════════════════════════════════════════

const contentCreateSchema = Joi.object({
  chapterId: Joi.string().required(),
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  title: Joi.string().required().trim(),
  contentType: Joi.string().valid('lesson', 'video', 'document', 'image', 'link', 'interactive', 'audio', 'meeting').required(),
  body: Joi.string().optional().allow(''),
  externalUrl: Joi.string().uri().optional().allow(''),
  meetingUrl: Joi.string().uri().optional().allow(''),
  duration: Joi.number().optional(),
  isDownloadable: Joi.boolean().optional(),
  sortOrder: Joi.number().default(0),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  tags: Joi.array().items(Joi.string()).default([]),
  branchId: Joi.string().optional()
});

const contentUpdateSchema = Joi.object({
  title: Joi.string().optional().trim(),
  contentType: Joi.string().valid('lesson', 'video', 'document', 'image', 'link', 'interactive', 'audio', 'meeting').optional(),
  body: Joi.string().optional().allow(''),
  externalUrl: Joi.string().uri().optional().allow(''),
  meetingUrl: Joi.string().uri().optional().allow(''),
  duration: Joi.number().optional(),
  isDownloadable: Joi.boolean().optional(),
  sortOrder: Joi.number().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  branchId: Joi.string().optional().allow('')
});

const contentQuerySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/).custom(v => Math.min(parseInt(v, 10), 100))).default(50),
  search: Joi.string().optional().allow(''),
  chapterId: Joi.string().optional().allow(''),
  subjectId: Joi.string().optional().allow(''),
  classId: Joi.string().optional().allow(''),
  contentType: Joi.string().valid('lesson', 'video', 'document', 'image', 'link', 'interactive', 'audio', 'meeting').optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  sortBy: Joi.string().valid('sortOrder', 'title', 'createdAt', 'contentType').default('sortOrder'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  branchId: Joi.string().optional().allow('')
});

// GET /api/lms/content
router.get('/content', checkPermission('classes', 'read'), validateQuery(contentQuerySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 50, search = '', chapterId = '', subjectId = '', classId = '', contentType = '', status = '', sortBy = 'sortOrder', sortOrder = 'asc' } = req.query as QueryParams;
  const filter: any = {};
  Object.assign(filter, getLmsReadFilter(req));
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }
  if (chapterId && Types.ObjectId.isValid(chapterId)) filter.chapterId = new Types.ObjectId(chapterId);
  if (subjectId && Types.ObjectId.isValid(subjectId)) filter.subjectId = new Types.ObjectId(subjectId);
  if (classId && Types.ObjectId.isValid(classId)) filter.classId = new Types.ObjectId(classId);
  if (contentType) filter.contentType = contentType;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    LessonContent.find(filter).sort(sortOptions).skip(skip).limit(Number(limit))
      .populate('chapterId', 'name chapterNumber')
      .populate('subjectId', 'name code')
      .populate('classId', 'name'),
    LessonContent.countDocuments(filter)
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Content fetched',
    data,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  };
  res.json(response);
});

// GET /api/lms/content/:id
router.get('/content/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getLmsReadFilter(req));
  const content = await LessonContent.findOne(filter)
    .populate('chapterId', 'name chapterNumber')
    .populate('subjectId', 'name code')
    .populate('classId', 'name');
  if (!content) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: content });
});

// POST /api/lms/content  (supports file upload)
router.post('/content', checkPermission('classes', 'create'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
}, async (req: AuthenticatedRequest, res) => {
  // Parse JSON fields from multipart form data
  const data = { ...req.body };
  if (typeof data.tags === 'string') {
    try { data.tags = JSON.parse(data.tags); } catch { data.tags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean); }
  }

  const { error } = contentCreateSchema.validate(data, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const orgBranch = getOrgBranchForCreate(req);

  // Handle file upload if present
  if (req.file) {
    try {
      const result = await doSpacesService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user!.branchId || 'global'
      );
      if (result.success) {
        data.fileUrl = result.cdnUrl || result.url;
        data.fileName = req.file.originalname;
        data.fileSize = req.file.size;
        data.mimeType = req.file.mimetype;
      } else {
        return res.status(500).json({ success: false, message: 'File upload failed: ' + result.message });
      }
    } catch (uploadErr: any) {
      return res.status(500).json({ success: false, message: 'File upload error: ' + uploadErr.message });
    }
  }

  const content = await LessonContent.create({ ...data, createdBy: req.user!._id, ...orgBranch });

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'create',
    module: 'lms',
    details: `Created content: ${content.title} (${content.contentType})`,
    ...orgBranch
  });

  res.status(201).json({ success: true, message: 'Content created', data: content });
});

// PUT /api/lms/content/:id
router.put('/content/:id', checkPermission('classes', 'update'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
}, async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });

  const data = { ...req.body };
  if (typeof data.tags === 'string') {
    try { data.tags = JSON.parse(data.tags); } catch { data.tags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean); }
  }

  // Handle file upload if present
  if (req.file) {
    try {
      const result = await doSpacesService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user!.branchId || 'global'
      );
      if (result.success) {
        data.fileUrl = result.cdnUrl || result.url;
        data.fileName = req.file.originalname;
        data.fileSize = req.file.size;
        data.mimeType = req.file.mimetype;
      }
    } catch { /* keep old file */ }
  }

  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const content = await LessonContent.findOneAndUpdate(filter, data, { new: true, runValidators: true });
  if (!content) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Content updated', data: content });
});

// DELETE /api/lms/content/:id
router.delete('/content/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const content = await LessonContent.findOneAndDelete(filter);
  if (!content) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Content deleted' });
});

// POST /api/lms/content/:id/publish
router.post('/content/:id/publish', checkPermission('classes', 'update'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const content = await LessonContent.findOneAndUpdate(filter, { status: 'published' }, { new: true });
  if (!content) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Content published', data: content });
});

// PUT /api/lms/content-reorder
router.put('/content-reorder', checkPermission('classes', 'update'), async (req: AuthenticatedRequest, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items array required' });

  const orgBranch = getOrgBranchFilter(req);
  const ops = items.map((item: { _id: string; sortOrder: number }) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(item._id), ...orgBranch },
      update: { $set: { sortOrder: item.sortOrder } }
    }
  }));
  await LessonContent.bulkWrite(ops);
  res.json({ success: true, message: 'Content reordered' });
});

// GET /api/lms/stats — Summary per class/subject
router.get('/stats', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  const filter: any = {};
  Object.assign(filter, getLmsReadFilter(req));
  const { classId, subjectId } = req.query as QueryParams;
  if (classId && Types.ObjectId.isValid(classId)) filter.classId = new Types.ObjectId(classId);
  if (subjectId && Types.ObjectId.isValid(subjectId)) filter.subjectId = new Types.ObjectId(subjectId);

  const [totalChapters, totalContent, publishedContent, draftContent] = await Promise.all([
    Chapter.countDocuments(filter),
    LessonContent.countDocuments(filter),
    LessonContent.countDocuments({ ...filter, status: 'published' }),
    LessonContent.countDocuments({ ...filter, status: 'draft' }),
  ]);

  // Content by type
  const contentByType = await LessonContent.aggregate([
    { $match: filter },
    { $group: { _id: '$contentType', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      totalChapters,
      totalContent,
      publishedContent,
      draftContent,
      contentByType: contentByType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// ASSESSMENT ROUTES
// ══════════════════════════════════════════════════════════════════════

const questionSchema = Joi.object({
  questionNumber: Joi.number().integer().min(1).required(),
  questionText: Joi.string().required(),
  questionType: Joi.string().valid('mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank').required(),
  options: Joi.array().items(Joi.object({
    optionId: Joi.string().required(),
    text: Joi.string().required(),
    isCorrect: Joi.boolean().default(false)
  })).default([]),
  correctAnswer: Joi.string().optional().allow(''),
  marks: Joi.number().min(0).default(1),
  explanation: Joi.string().optional().allow(''),
  imageUrl: Joi.string().optional().allow('')
});

const assessmentSettingsSchema = Joi.object({
  shuffleQuestions: Joi.boolean().default(false),
  shuffleOptions: Joi.boolean().default(false),
  showResults: Joi.string().valid('immediately', 'after_due_date', 'manual').default('immediately'),
  allowRetake: Joi.boolean().default(false),
  maxRetakes: Joi.number().integer().min(1).default(1),
  showCorrectAnswers: Joi.boolean().default(true)
});

const assessmentCreateSchema = Joi.object({
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  chapterId: Joi.string().optional().allow(''),
  title: Joi.string().required().trim(),
  assessmentType: Joi.string().valid('quiz', 'assignment', 'online_exam').required(),
  instructions: Joi.string().optional().allow(''),
  totalMarks: Joi.number().min(0).default(0),
  passingMarks: Joi.number().min(0).default(0),
  duration: Joi.number().optional(),
  questions: Joi.array().items(questionSchema).default([]),
  settings: assessmentSettingsSchema.default(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  branchId: Joi.string().optional()
});

const assessmentUpdateSchema = Joi.object({
  title: Joi.string().optional().trim(),
  assessmentType: Joi.string().valid('quiz', 'assignment', 'online_exam').optional(),
  instructions: Joi.string().optional().allow(''),
  totalMarks: Joi.number().min(0).optional(),
  passingMarks: Joi.number().min(0).optional(),
  duration: Joi.number().optional().allow(null),
  questions: Joi.array().items(questionSchema).optional(),
  settings: assessmentSettingsSchema.optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  chapterId: Joi.string().optional().allow('', null),
  branchId: Joi.string().optional().allow('')
});

const assessmentQuerySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/).custom(v => Math.min(parseInt(v, 10), 100))).default(50),
  search: Joi.string().optional().allow(''),
  subjectId: Joi.string().optional().allow(''),
  classId: Joi.string().optional().allow(''),
  chapterId: Joi.string().optional().allow(''),
  assessmentType: Joi.string().valid('quiz', 'assignment', 'online_exam').optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  sortBy: Joi.string().valid('title', 'createdAt', 'assessmentType', 'totalMarks').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  branchId: Joi.string().optional().allow('')
});

// GET /api/lms/assessments
router.get('/assessments', checkPermission('classes', 'read'), validateQuery(assessmentQuerySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 50, search = '', subjectId = '', classId = '', chapterId = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query as QueryParams;
  const assessmentType = (req.query as any).assessmentType || '';
  const filter: any = {};
  Object.assign(filter, getLmsReadFilter(req));
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { instructions: { $regex: search, $options: 'i' } }
    ];
  }
  if (subjectId && Types.ObjectId.isValid(subjectId)) filter.subjectId = new Types.ObjectId(subjectId);
  if (classId && Types.ObjectId.isValid(classId)) filter.classId = new Types.ObjectId(classId);
  if (chapterId && Types.ObjectId.isValid(chapterId)) filter.chapterId = new Types.ObjectId(chapterId);
  if (assessmentType) filter.assessmentType = assessmentType;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    LmsAssessment.find(filter).sort(sortOptions).skip(skip).limit(Number(limit))
      .populate('subjectId', 'name code')
      .populate('classId', 'name')
      .populate('chapterId', 'name chapterNumber'),
    LmsAssessment.countDocuments(filter)
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Assessments fetched',
    data,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  };
  res.json(response);
});

// GET /api/lms/assessments/:id
router.get('/assessments/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getLmsReadFilter(req));
  const assessment = await LmsAssessment.findOne(filter)
    .populate('subjectId', 'name code')
    .populate('classId', 'name')
    .populate('chapterId', 'name chapterNumber');
  if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: assessment });
});

// GET /api/lms/assessments/:id/student — student view (hides correct answers)
router.get('/assessments/:id/student', async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id, status: 'published' };
  Object.assign(filter, getLmsReadFilter(req));
  const assessment = await LmsAssessment.findOne(filter)
    .populate('subjectId', 'name code')
    .populate('classId', 'name')
    .populate('chapterId', 'name chapterNumber');
  if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });

  // Strip correct answers for student view
  const sanitized = assessment.toObject();
  sanitized.questions = sanitized.questions.map((q: any) => ({
    ...q,
    options: q.options.map((o: any) => ({ optionId: o.optionId, text: o.text })),
    correctAnswer: undefined,
    explanation: undefined
  }));

  res.json({ success: true, data: sanitized });
});

// POST /api/lms/assessments
router.post('/assessments', checkPermission('classes', 'create'), validate(assessmentCreateSchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const data = { ...req.body };

  // Auto-calculate totalMarks from questions if not explicitly set
  if (data.questions && data.questions.length > 0 && !data.totalMarks) {
    data.totalMarks = data.questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
  }

  // Clean empty chapterId
  if (!data.chapterId) delete data.chapterId;

  const assessment = await LmsAssessment.create({ ...data, createdBy: req.user!._id, ...orgBranch });

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'create',
    module: 'lms',
    details: `Created assessment: ${assessment.title} (${assessment.assessmentType})`,
    ...orgBranch
  });

  res.status(201).json({ success: true, message: 'Assessment created', data: assessment });
});

// PUT /api/lms/assessments/:id
router.put('/assessments/:id', checkPermission('classes', 'update'), validate(assessmentUpdateSchema), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const data = { ...req.body };

  // Auto-calculate totalMarks
  if (data.questions && data.questions.length > 0) {
    data.totalMarks = data.questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
  }
  if (data.chapterId === '' || data.chapterId === null) data.chapterId = undefined;

  const assessment = await LmsAssessment.findOneAndUpdate(filter, data, { new: true, runValidators: true });
  if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Assessment updated', data: assessment });
});

// DELETE /api/lms/assessments/:id
router.delete('/assessments/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const assessment = await LmsAssessment.findOneAndDelete(filter);
  if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
  // Also delete submissions for this assessment
  await StudentSubmission.deleteMany({ assessmentId: assessment._id, ...getOrgBranchFilter(req) });
  res.json({ success: true, message: 'Assessment deleted' });
});

// POST /api/lms/assessments/:id/publish
router.post('/assessments/:id/publish', checkPermission('classes', 'update'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const assessment = await LmsAssessment.findOne(filter);
  if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
  if (assessment.questions.length === 0 && assessment.assessmentType !== 'assignment') {
    return res.status(400).json({ success: false, message: 'Cannot publish assessment with no questions' });
  }
  assessment.status = 'published';
  await assessment.save();
  res.json({ success: true, message: 'Assessment published', data: assessment });
});

// POST /api/lms/assessments/:id/duplicate
router.post('/assessments/:id/duplicate', checkPermission('classes', 'create'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const original = await LmsAssessment.findOne(filter);
  if (!original) return res.status(404).json({ success: false, message: 'Not found' });

  const orgBranch = getOrgBranchForCreate(req);
  const clone = original.toObject();
  delete (clone as any)._id;
  clone.title = `${clone.title} (Copy)`;
  clone.status = 'draft';
  clone.createdBy = req.user!._id;
  Object.assign(clone, orgBranch);

  // Override class/subject if provided in body
  if (req.body.classId) clone.classId = req.body.classId;
  if (req.body.subjectId) clone.subjectId = req.body.subjectId;

  const newAssessment = await LmsAssessment.create(clone);
  res.status(201).json({ success: true, message: 'Assessment duplicated', data: newAssessment });
});

// ══════════════════════════════════════════════════════════════════════
// SUBMISSION ROUTES
// ══════════════════════════════════════════════════════════════════════

const submissionQuerySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/).custom(v => Math.min(parseInt(v, 10), 100))).default(50),
  assessmentId: Joi.string().optional().allow(''),
  studentId: Joi.string().optional().allow(''),
  status: Joi.string().valid('not_started', 'in_progress', 'submitted', 'graded', 'returned').optional(),
  sortBy: Joi.string().valid('submittedAt', 'createdAt', 'totalMarksAwarded', 'percentage').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  branchId: Joi.string().optional().allow('')
});

// GET /api/lms/submissions — teacher view
router.get('/submissions', checkPermission('classes', 'read'), validateQuery(submissionQuerySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 50, status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query as QueryParams;
  const { assessmentId, studentId } = req.query as any;
  const filter: any = {};
  Object.assign(filter, getOrgBranchFilter(req));
  if (assessmentId && Types.ObjectId.isValid(assessmentId)) filter.assessmentId = new Types.ObjectId(assessmentId);
  if (studentId && Types.ObjectId.isValid(studentId)) filter.studentId = new Types.ObjectId(studentId);
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    StudentSubmission.find(filter).sort(sortOptions).skip(skip).limit(Number(limit))
      .populate('assessmentId', 'title assessmentType totalMarks passingMarks')
      .populate('studentId', 'name admissionNo classId')
      .populate('gradedBy', 'name'),
    StudentSubmission.countDocuments(filter)
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Submissions fetched',
    data,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  };
  res.json(response);
});

// GET /api/lms/submissions/:id
router.get('/submissions/:id', async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const submission = await StudentSubmission.findOne(filter)
    .populate('assessmentId')
    .populate('studentId', 'name admissionNo classId')
    .populate('gradedBy', 'name');
  if (!submission) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: submission });
});

// POST /api/lms/submissions — student submits answers
router.post('/submissions', async (req: AuthenticatedRequest, res) => {
  const { assessmentId, studentId, answers, textResponse, submissionType } = req.body;
  if (!assessmentId || !studentId) {
    return res.status(400).json({ success: false, message: 'assessmentId and studentId are required' });
  }

  const orgBranch = getOrgBranchForCreate(req);

  // Get the assessment
  const assessment = await LmsAssessment.findById(assessmentId);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment was not found.' });
  if (assessment.status !== 'published') return res.status(400).json({ success: false, message: 'Assessment is not published' });

  // Check existing submissions for retake logic
  const existingCount = await StudentSubmission.countDocuments({
    assessmentId: new Types.ObjectId(assessmentId),
    studentId: new Types.ObjectId(studentId),
    status: { $in: ['submitted', 'graded'] }
  });

  if (!assessment.settings.allowRetake && existingCount > 0) {
    return res.status(400).json({ success: false, message: 'Retake not allowed for this assessment' });
  }
  if (assessment.settings.allowRetake && existingCount >= assessment.settings.maxRetakes) {
    return res.status(400).json({ success: false, message: `Maximum retakes (${assessment.settings.maxRetakes}) reached` });
  }

  // Auto-grade MCQ / true_false / fill_blank
  let gradedAnswers = answers || [];
  let totalMarksAwarded = 0;
  let allAutoGradeable = true;

  if (Array.isArray(gradedAnswers) && gradedAnswers.length > 0) {
    gradedAnswers = gradedAnswers.map((ans: any) => {
      const question = assessment.questions.find(q => q.questionNumber === ans.questionNumber);
      if (!question) return { ...ans, marksAwarded: 0 };

      if (question.questionType === 'mcq' || question.questionType === 'true_false') {
        const correctOpt = question.options.find(o => o.isCorrect);
        const isCorrect = correctOpt ? ans.selectedOption === correctOpt.optionId : false;
        return {
          ...ans,
          isCorrect,
          marksAwarded: isCorrect ? question.marks : 0
        };
      } else if (question.questionType === 'fill_blank' && question.correctAnswer) {
        const isCorrect = (ans.textAnswer || '').trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        return {
          ...ans,
          isCorrect,
          marksAwarded: isCorrect ? question.marks : 0
        };
      } else {
        // short_answer / long_answer — needs manual grading
        allAutoGradeable = false;
        return { ...ans, isCorrect: undefined, marksAwarded: undefined };
      }
    });

    totalMarksAwarded = gradedAnswers.reduce((sum: number, a: any) => sum + (a.marksAwarded || 0), 0);
  }

  const percentage = assessment.totalMarks > 0 ? Math.round((totalMarksAwarded / assessment.totalMarks) * 100) : 0;
  const isPassed = totalMarksAwarded >= assessment.passingMarks;
  const autoStatus = allAutoGradeable ? 'graded' : 'submitted';

  const submission = await StudentSubmission.create({
    assessmentId,
    studentId,
    submissionType: submissionType || 'mcq_answers',
    answers: gradedAnswers,
    textResponse,
    totalMarksAwarded: allAutoGradeable ? totalMarksAwarded : undefined,
    percentage: allAutoGradeable ? percentage : undefined,
    isPassed: allAutoGradeable ? isPassed : undefined,
    submittedAt: new Date(),
    startedAt: req.body.startedAt || new Date(),
    timeSpent: req.body.timeSpent || 0,
    attemptNumber: existingCount + 1,
    status: autoStatus,
    ...(allAutoGradeable ? { gradedAt: new Date() } : {}),
    ...orgBranch
  });

  res.status(201).json({
    success: true,
    message: allAutoGradeable ? 'Submission graded automatically' : 'Submission received, awaiting grading',
    data: submission
  });
});

// POST /api/lms/submissions/:id/grade — teacher grades a submission
router.post('/submissions/:id/grade', checkPermission('classes', 'update'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const submission = await StudentSubmission.findOne(filter);
  if (!submission) return res.status(404).json({ success: false, message: 'Not found' });
  if (submission.status !== 'submitted' && submission.status !== 'returned') {
    return res.status(400).json({ success: false, message: 'Submission is not in gradable state' });
  }

  const { answers, feedback, totalMarksAwarded } = req.body;

  // Get assessment for totalMarks
  const assessment = await LmsAssessment.findById(submission.assessmentId);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment was not found.' });

  // Update answers with grades if provided
  if (Array.isArray(answers)) {
    submission.answers = answers;
  }

  const finalMarks = totalMarksAwarded !== undefined
    ? totalMarksAwarded
    : submission.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);

  submission.totalMarksAwarded = finalMarks;
  submission.percentage = assessment.totalMarks > 0 ? Math.round((finalMarks / assessment.totalMarks) * 100) : 0;
  submission.isPassed = finalMarks >= assessment.passingMarks;
  submission.grade = req.body.grade || undefined;
  submission.feedback = feedback || undefined;
  submission.gradedBy = req.user!._id;
  submission.gradedAt = new Date();
  submission.status = 'graded';

  await submission.save();
  res.json({ success: true, message: 'Submission graded', data: submission });
});

// POST /api/lms/submissions/:id/return — return for revision
router.post('/submissions/:id/return', checkPermission('classes', 'update'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const submission = await StudentSubmission.findOneAndUpdate(
    filter,
    { status: 'returned', feedback: req.body.feedback || 'Returned for revision' },
    { new: true }
  );
  if (!submission) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Submission returned for revision', data: submission });
});

// GET /api/lms/submissions/assessment-summary/:assessmentId — summary for teacher
router.get('/submissions/assessment-summary/:assessmentId', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.assessmentId)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const assessmentObjId = new Types.ObjectId(req.params.assessmentId);
  const orgBranch = getOrgBranchFilter(req);

  const [assessment, submissions] = await Promise.all([
    LmsAssessment.findOne({ _id: assessmentObjId, ...orgBranch }),
    StudentSubmission.find({ assessmentId: assessmentObjId, ...orgBranch })
      .populate('studentId', 'name admissionNo')
  ]);

  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment was not found.' });

  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const passedCount = gradedSubmissions.filter(s => s.isPassed).length;
  const scores = gradedSubmissions.map(s => s.totalMarksAwarded || 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Per-question analysis
  const questionAnalysis = assessment.questions.map(q => {
    const answersForQ = submissions
      .flatMap(s => s.answers.filter(a => a.questionNumber === q.questionNumber));
    const correctCount = answersForQ.filter(a => a.isCorrect).length;
    const attemptCount = answersForQ.length;
    return {
      questionNumber: q.questionNumber,
      questionText: q.questionText.substring(0, 80),
      questionType: q.questionType,
      marks: q.marks,
      attempted: attemptCount,
      correct: correctCount,
      accuracy: attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0
    };
  });

  res.json({
    success: true,
    data: {
      assessment: { _id: assessment._id, title: assessment.title, totalMarks: assessment.totalMarks, passingMarks: assessment.passingMarks },
      summary: {
        totalSubmissions,
        gradedCount: gradedSubmissions.length,
        passedCount,
        failedCount: gradedSubmissions.length - passedCount,
        avgScore,
        highestScore,
        lowestScore,
        passRate: gradedSubmissions.length > 0 ? Math.round((passedCount / gradedSubmissions.length) * 100) : 0
      },
      questionAnalysis,
      submissions: submissions.map(s => ({
        _id: s._id,
        student: s.studentId,
        totalMarksAwarded: s.totalMarksAwarded,
        percentage: s.percentage,
        isPassed: s.isPassed,
        status: s.status,
        submittedAt: s.submittedAt,
        attemptNumber: s.attemptNumber
      }))
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// CLASS CONTENT ASSIGNMENTS (Scheduling)
// ════════════════════════════════════════════════════════════════════

const assignmentValidation = Joi.object({
  contentType: Joi.string().valid('lesson', 'assessment').required(),
  contentId: Joi.string().required(),
  classId: Joi.string().required(),
  divisionIds: Joi.array().items(Joi.string()).default([]),
  availableFrom: Joi.date().required(),
  availableUntil: Joi.date().allow(null),
  dueDate: Joi.date().allow(null),
  scheduleType: Joi.string().valid('immediate', 'scheduled', 'recurring').default('immediate'),
  recurringConfig: Joi.object({
    frequency: Joi.string().valid('daily', 'weekly', 'bi_weekly', 'monthly'),
    dayOfWeek: Joi.number().min(0).max(6),
    dayOfMonth: Joi.number().min(1).max(31),
    endDate: Joi.date()
  }).allow(null),
  title: Joi.string().required().max(200),
  description: Joi.string().allow('', null)
});

// GET /assignments — list with filters
router.get('/assignments', async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, contentType, status, search, page = '1', limit = '20' } = req.query as any;
    const filter: any = getOrgBranchFilter(req);

    if (classId) filter.classId = new Types.ObjectId(classId);
    if (contentType && contentType !== '__all__') filter.contentType = contentType;
    if (status && status !== '__all__') filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [assignments, total] = await Promise.all([
      ClassContentAssignment.find(filter)
        .populate('classId', 'name')
        .populate('divisionIds', 'name')
        .populate('assignedBy', 'name')
        .sort({ availableFrom: -1 })
        .skip(skip).limit(limitNum).lean(),
      ClassContentAssignment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Assignments fetched',
      data: assignments,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /assignments/calendar — calendar events for a month
router.get('/assignments/calendar', async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, month, year } = req.query as any;
    const filter: any = getOrgBranchFilter(req);

    if (classId) filter.classId = new Types.ObjectId(classId);

    // Build date range for the month
    const m = parseInt(month) - 1; // JS months are 0-indexed
    const y = parseInt(year);
    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 0, 23, 59, 59);

    filter.$or = [
      { availableFrom: { $gte: startDate, $lte: endDate } },
      { dueDate: { $gte: startDate, $lte: endDate } },
      { availableFrom: { $lte: startDate }, availableUntil: { $gte: startDate } }
    ];

    const assignments = await ClassContentAssignment.find(filter)
      .populate('classId', 'name')
      .sort({ availableFrom: 1 })
      .lean();

    res.json({ success: true, message: 'Calendar events fetched', data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /assignments/:id — single
router.get('/assignments/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const assignment = await ClassContentAssignment.findOne({
      _id: req.params.id,
      ...getOrgBranchFilter(req)
    })
      .populate('classId', 'name')
      .populate('divisionIds', 'name')
      .populate('assignedBy', 'name')
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment was not found.' });
    }
    res.json({ success: true, message: 'Assignment fetched', data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /assignments — create (single or bulk via classIds array)
router.post('/assignments', validate(Joi.object({
  contentType: Joi.string().valid('lesson', 'assessment').required(),
  contentId: Joi.string().required(),
  classId: Joi.string(),
  classIds: Joi.array().items(Joi.string()),
  divisionIds: Joi.array().items(Joi.string()).default([]),
  availableFrom: Joi.date().required(),
  availableUntil: Joi.date().allow(null),
  dueDate: Joi.date().allow(null),
  scheduleType: Joi.string().valid('immediate', 'scheduled', 'recurring').default('immediate'),
  recurringConfig: Joi.object({
    frequency: Joi.string().valid('daily', 'weekly', 'bi_weekly', 'monthly'),
    dayOfWeek: Joi.number().min(0).max(6),
    dayOfMonth: Joi.number().min(1).max(31),
    endDate: Joi.date()
  }).allow(null),
  title: Joi.string().required().max(200),
  description: Joi.string().allow('', null)
}).or('classId', 'classIds')), async (req: AuthenticatedRequest, res) => {
  try {
    const orgBranch = getOrgBranchForCreate(req);
    const { classIds, classId, contentType, contentId, title, description, divisionIds, availableFrom, availableUntil, dueDate, scheduleType, recurringConfig } = req.body;

    const targetClassIds = classIds || [classId];
    const now = new Date();
    const isImmediate = scheduleType === 'immediate' || new Date(availableFrom) <= now;

    const docs = targetClassIds.map((cId: string) => ({
      contentType,
      contentId: new Types.ObjectId(contentId),
      classId: new Types.ObjectId(cId),
      divisionIds: (divisionIds || []).map((d: string) => new Types.ObjectId(d)),
      availableFrom: new Date(availableFrom),
      availableUntil: availableUntil ? new Date(availableUntil) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: isImmediate ? 'active' : 'scheduled',
      isPublished: isImmediate,
      assignedBy: req.user!._id,
      scheduleType: scheduleType || 'immediate',
      recurringConfig: recurringConfig || undefined,
      title,
      description,
      ...orgBranch,
      createdBy: req.user!._id
    }));

    const created = await ClassContentAssignment.insertMany(docs);

    res.status(201).json({
      success: true,
      message: `Assigned to ${created.length} class(es)`,
      data: created
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /assignments/:id — update
router.put('/assignments/:id', validate(Joi.object({
  title: Joi.string().max(200),
  description: Joi.string().allow('', null),
  divisionIds: Joi.array().items(Joi.string()),
  availableFrom: Joi.date(),
  availableUntil: Joi.date().allow(null),
  dueDate: Joi.date().allow(null),
  status: Joi.string().valid('scheduled', 'active', 'completed', 'cancelled'),
  scheduleType: Joi.string().valid('immediate', 'scheduled', 'recurring'),
  recurringConfig: Joi.object({
    frequency: Joi.string().valid('daily', 'weekly', 'bi_weekly', 'monthly'),
    dayOfWeek: Joi.number().min(0).max(6),
    dayOfMonth: Joi.number().min(1).max(31),
    endDate: Joi.date()
  }).allow(null)
}).min(1)), async (req: AuthenticatedRequest, res) => {
  try {
    const assignment = await ClassContentAssignment.findOneAndUpdate(
      { _id: req.params.id, ...getOrgBranchFilter(req) },
      { $set: req.body },
      { new: true }
    )
      .populate('classId', 'name')
      .populate('divisionIds', 'name');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment was not found.' });
    }
    res.json({ success: true, message: 'Assignment updated', data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /assignments/:id
router.delete('/assignments/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const assignment = await ClassContentAssignment.findOneAndDelete({
      _id: req.params.id,
      ...getOrgBranchFilter(req)
    });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment was not found.' });
    }
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /assignments/:id/activate — manually activate a scheduled assignment
router.post('/assignments/:id/activate', async (req: AuthenticatedRequest, res) => {
  try {
    const assignment = await ClassContentAssignment.findOneAndUpdate(
      { _id: req.params.id, ...getOrgBranchFilter(req), status: 'scheduled' },
      { $set: { status: 'active', isPublished: true } },
      { new: true }
    );
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found or already active' });
    }
    res.json({ success: true, message: 'Assignment activated', data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /assignments/:id/complete — mark as completed
router.post('/assignments/:id/complete', async (req: AuthenticatedRequest, res) => {
  try {
    const assignment = await ClassContentAssignment.findOneAndUpdate(
      { _id: req.params.id, ...getOrgBranchFilter(req), status: 'active' },
      { $set: { status: 'completed' } },
      { new: true }
    );
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found or not active' });
    }
    res.json({ success: true, message: 'Assignment completed', data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /assignments/student/my — student's assigned content
router.get('/assignments/student/my', async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = getOrgBranchFilter(req);
    filter.status = 'active';
    filter.isPublished = true;

    // If user has classId/section we can filter by their class
    const { classId, contentType } = req.query as any;
    if (classId) filter.classId = new Types.ObjectId(classId);
    if (contentType && contentType !== '__all__') filter.contentType = contentType;

    const assignments = await ClassContentAssignment.find(filter)
      .populate('classId', 'name')
      .sort({ dueDate: 1, availableFrom: -1 })
      .lean();

    res.json({ success: true, message: 'Student assignments fetched', data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════
// CONTENT PROGRESS TRACKING
// ════════════════════════════════════════════════════════════════════

// POST /progress/track — log/update content view
router.post('/progress/track', validate(Joi.object({
  studentId: Joi.string().required(),
  contentId: Joi.string().required(),
  chapterId: Joi.string().required(),
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  timeSpent: Joi.number().min(0).default(0),
  isCompleted: Joi.boolean().default(false),
  videoProgress: Joi.number().min(0).max(100),
  lastPosition: Joi.number().min(0)
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgBranch = getOrgBranchForCreate(req);
    const { studentId, contentId, chapterId, subjectId, classId, timeSpent, isCompleted, videoProgress, lastPosition } = req.body;

    const update: any = {
      $inc: { timeSpent: timeSpent || 0, accessCount: 1 },
      $set: {
        lastAccessedAt: new Date(),
        chapterId: new Types.ObjectId(chapterId),
        subjectId: new Types.ObjectId(subjectId),
        classId: new Types.ObjectId(classId),
        ...orgBranch
      }
    };

    if (isCompleted) {
      update.$set.isCompleted = true;
      update.$set.completedAt = new Date();
    }
    if (videoProgress !== undefined) update.$set.videoProgress = videoProgress;
    if (lastPosition !== undefined) update.$set.lastPosition = lastPosition;

    const progress = await ContentProgress.findOneAndUpdate(
      {
        studentId: new Types.ObjectId(studentId),
        contentId: new Types.ObjectId(contentId),
        ...getOrgBranchFilter(req)
      },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Progress tracked', data: progress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /progress/student/:studentId — student's progress across subjects
router.get('/progress/student/:studentId', async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, subjectId } = req.query as any;
    const filter: any = {
      studentId: new Types.ObjectId(req.params.studentId),
      ...getOrgBranchFilter(req)
    };
    if (classId) filter.classId = new Types.ObjectId(classId);
    if (subjectId) filter.subjectId = new Types.ObjectId(subjectId);

    // Aggregate by subject
    const subjectProgress = await ContentProgress.aggregate([
      { $match: filter },
      { $group: {
        _id: { subjectId: '$subjectId', classId: '$classId' },
        totalContent: { $sum: 1 },
        completedContent: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalTimeSpent: { $sum: '$timeSpent' },
        totalAccessCount: { $sum: '$accessCount' },
        lastAccessed: { $max: '$lastAccessedAt' }
      }},
      { $lookup: { from: 'subjects', localField: '_id.subjectId', foreignField: '_id', as: 'subject' } },
      { $lookup: { from: 'classes', localField: '_id.classId', foreignField: '_id', as: 'class' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      { $project: {
        subjectId: '$_id.subjectId',
        classId: '$_id.classId',
        subjectName: '$subject.name',
        className: '$class.name',
        totalContent: 1,
        completedContent: 1,
        completionRate: { $cond: [
          { $gt: ['$totalContent', 0] },
          { $multiply: [{ $divide: ['$completedContent', '$totalContent'] }, 100] },
          0
        ]},
        totalTimeSpent: 1,
        totalAccessCount: 1,
        lastAccessed: 1
      }},
      { $sort: { 'className': 1, 'subjectName': 1 } }
    ]);

    // Get total available content for each subject/class to compute real progress
    const contentCounts = await LessonContent.aggregate([
      { $match: { status: 'published', ...getOrgBranchFilter(req), ...(classId ? { classId: new Types.ObjectId(classId) } : {}) } },
      { $group: { _id: { subjectId: '$subjectId', classId: '$classId' }, total: { $sum: 1 } } }
    ]);

    const countMap: Record<string, number> = {};
    contentCounts.forEach((c: any) => {
      countMap[`${c._id.subjectId}_${c._id.classId}`] = c.total;
    });

    const enriched = subjectProgress.map((sp: any) => {
      const totalAvailable = countMap[`${sp.subjectId}_${sp.classId}`] || sp.totalContent;
      return {
        ...sp,
        totalAvailable,
        realCompletionRate: totalAvailable > 0 ? Math.round((sp.completedContent / totalAvailable) * 100) : 0
      };
    });

    res.json({ success: true, message: 'Student progress fetched', data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /progress/class/:classId — class-level progress overview
router.get('/progress/class/:classId', async (req: AuthenticatedRequest, res) => {
  try {
    const { subjectId, chapterId } = req.query as any;
    const filter: any = {
      classId: new Types.ObjectId(req.params.classId),
      ...getOrgBranchFilter(req)
    };
    if (subjectId) filter.subjectId = new Types.ObjectId(subjectId);
    if (chapterId) filter.chapterId = new Types.ObjectId(chapterId);

    // Per student aggregation
    const studentProgress = await ContentProgress.aggregate([
      { $match: filter },
      { $group: {
        _id: '$studentId',
        totalViewed: { $sum: 1 },
        completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalTimeSpent: { $sum: '$timeSpent' },
        lastAccessed: { $max: '$lastAccessedAt' }
      }},
      { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $project: {
        studentId: '$_id',
        studentName: '$student.name',
        admissionNo: '$student.admissionNo',
        section: '$student.section',
        totalViewed: 1,
        completedCount: 1,
        totalTimeSpent: 1,
        lastAccessed: 1
      }},
      { $sort: { completedCount: -1 } }
    ]);

    // Overall stats
    const overallPipeline = await ContentProgress.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        uniqueStudents: { $addToSet: '$studentId' },
        totalViews: { $sum: '$accessCount' },
        completedEntries: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalEntries: { $sum: 1 },
        totalTimeSpent: { $sum: '$timeSpent' }
      }},
      { $project: {
        uniqueStudentCount: { $size: '$uniqueStudents' },
        totalViews: 1,
        completedEntries: 1,
        totalEntries: 1,
        totalTimeSpent: 1,
        overallCompletion: { $cond: [
          { $gt: ['$totalEntries', 0] },
          { $multiply: [{ $divide: ['$completedEntries', '$totalEntries'] }, 100] },
          0
        ]}
      }}
    ]);

    res.json({
      success: true,
      message: 'Class progress fetched',
      data: {
        overview: overallPipeline[0] || { uniqueStudentCount: 0, totalViews: 0, completedEntries: 0, totalEntries: 0, totalTimeSpent: 0, overallCompletion: 0 },
        students: studentProgress
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /progress/dashboard — teacher dashboard aggregate
router.get('/progress/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = getOrgBranchFilter(req);
    const { classId } = req.query as any;
    if (classId) filter.classId = new Types.ObjectId(classId);

    // Aggregate per subject
    const bySubject = await ContentProgress.aggregate([
      { $match: filter },
      { $group: {
        _id: '$subjectId',
        uniqueStudents: { $addToSet: '$studentId' },
        completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalEntries: { $sum: 1 },
        totalTimeSpent: { $sum: '$timeSpent' }
      }},
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $project: {
        subjectId: '$_id',
        subjectName: '$subject.name',
        studentCount: { $size: '$uniqueStudents' },
        completedCount: 1,
        totalEntries: 1,
        totalTimeSpent: 1,
        completionRate: { $cond: [{ $gt: ['$totalEntries', 0] }, { $multiply: [{ $divide: ['$completedCount', '$totalEntries'] }, 100] }, 0] }
      }},
      { $sort: { subjectName: 1 } }
    ]);

    // Recent activity
    const recentActivity = await ContentProgress.find(filter)
      .populate('studentId', 'name admissionNo')
      .populate('contentId', 'title contentType')
      .populate('subjectId', 'name')
      .sort({ lastAccessedAt: -1 })
      .limit(20)
      .lean();

    // Overall totals
    const totals = await ContentProgress.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        uniqueStudents: { $addToSet: '$studentId' },
        totalViews: { $sum: '$accessCount' },
        totalCompleted: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalTime: { $sum: '$timeSpent' }
      }},
      { $project: {
        studentCount: { $size: '$uniqueStudents' },
        totalViews: 1,
        totalCompleted: 1,
        totalTime: 1
      }}
    ]);

    res.json({
      success: true,
      message: 'Dashboard data fetched',
      data: {
        totals: totals[0] || { studentCount: 0, totalViews: 0, totalCompleted: 0, totalTime: 0 },
        bySubject,
        recentActivity
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════════════════════════════

// GET /reports/class-performance — class performance across subjects/assessments
router.get('/reports/class-performance', async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, subjectId } = req.query as any;
    if (!classId) return res.status(400).json({ success: false, message: 'classId required' });

    const orgFilter = getOrgBranchFilter(req);

    // Assessment performance
    const assessmentFilter: any = { ...orgFilter, classId: new Types.ObjectId(classId) };
    if (subjectId) assessmentFilter.subjectId = new Types.ObjectId(subjectId);

    const assessments = await LmsAssessment.find({ ...assessmentFilter, status: 'published' }).select('_id title totalMarks passingMarks subjectId').lean();
    const assessmentIds = assessments.map(a => a._id);

    const submissionStats = await StudentSubmission.aggregate([
      { $match: { assessmentId: { $in: assessmentIds }, status: 'graded', ...orgFilter } },
      { $group: {
        _id: '$assessmentId',
        totalSubmissions: { $sum: 1 },
        avgScore: { $avg: '$totalMarksAwarded' },
        avgPercentage: { $avg: '$percentage' },
        passedCount: { $sum: { $cond: ['$isPassed', 1, 0] } },
        highestScore: { $max: '$totalMarksAwarded' },
        lowestScore: { $min: '$totalMarksAwarded' }
      }}
    ]);

    const statsMap: Record<string, any> = {};
    submissionStats.forEach((s: any) => { statsMap[s._id.toString()] = s; });

    const assessmentReport = assessments.map(a => ({
      _id: a._id,
      title: a.title,
      totalMarks: a.totalMarks,
      passingMarks: a.passingMarks,
      stats: statsMap[a._id.toString()] || { totalSubmissions: 0, avgScore: 0, avgPercentage: 0, passedCount: 0, highestScore: 0, lowestScore: 0 }
    }));

    // Content engagement
    const contentFilter: any = { classId: new Types.ObjectId(classId), ...orgFilter };
    if (subjectId) contentFilter.subjectId = new Types.ObjectId(subjectId);

    const contentEngagement = await ContentProgress.aggregate([
      { $match: contentFilter },
      { $group: {
        _id: '$chapterId',
        uniqueStudents: { $addToSet: '$studentId' },
        totalViews: { $sum: '$accessCount' },
        completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalEntries: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' }
      }},
      { $lookup: { from: 'chapters', localField: '_id', foreignField: '_id', as: 'chapter' } },
      { $unwind: { path: '$chapter', preserveNullAndEmptyArrays: true } },
      { $project: {
        chapterId: '$_id',
        chapterName: '$chapter.name',
        chapterNumber: '$chapter.chapterNumber',
        studentCount: { $size: '$uniqueStudents' },
        totalViews: 1,
        completedCount: 1,
        totalEntries: 1,
        avgTimeSpent: 1,
        completionRate: { $cond: [{ $gt: ['$totalEntries', 0] }, { $multiply: [{ $divide: ['$completedCount', '$totalEntries'] }, 100] }, 0] }
      }},
      { $sort: { chapterNumber: 1 } }
    ]);

    res.json({
      success: true,
      message: 'Class performance report',
      data: { assessments: assessmentReport, contentEngagement }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /reports/student-activity — individual student activity
router.get('/reports/student-activity', async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, classId, dateFrom, dateTo } = req.query as any;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId required' });

    const orgFilter = getOrgBranchFilter(req);
    const progressFilter: any = { studentId: new Types.ObjectId(studentId), ...orgFilter };
    if (classId) progressFilter.classId = new Types.ObjectId(classId);
    if (dateFrom || dateTo) {
      progressFilter.lastAccessedAt = {};
      if (dateFrom) progressFilter.lastAccessedAt.$gte = new Date(dateFrom);
      if (dateTo) progressFilter.lastAccessedAt.$lte = new Date(dateTo);
    }

    // Content progress
    const contentProgress = await ContentProgress.find(progressFilter)
      .populate('contentId', 'title contentType')
      .populate('chapterId', 'name chapterNumber')
      .populate('subjectId', 'name')
      .sort({ lastAccessedAt: -1 })
      .lean();

    // Assessment submissions
    const submissionFilter: any = { studentId: new Types.ObjectId(studentId), ...orgFilter };
    const submissions = await StudentSubmission.find(submissionFilter)
      .populate('assessmentId', 'title assessmentType totalMarks passingMarks subjectId classId')
      .sort({ submittedAt: -1 })
      .lean();

    // Summary
    const totalContentViewed = contentProgress.length;
    const totalCompleted = contentProgress.filter((p: any) => p.isCompleted).length;
    const totalTimeSpent = contentProgress.reduce((sum: number, p: any) => sum + (p.timeSpent || 0), 0);
    const totalAssessments = submissions.length;
    const gradedSubmissions = submissions.filter((s: any) => s.status === 'graded');
    const avgScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0) / gradedSubmissions.length
      : 0;

    res.json({
      success: true,
      message: 'Student activity report',
      data: {
        summary: { totalContentViewed, totalCompleted, totalTimeSpent, totalAssessments, avgScore: Math.round(avgScore) },
        contentProgress,
        submissions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /reports/content-engagement — per-content stats
router.get('/reports/content-engagement', async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, subjectId, chapterId } = req.query as any;
    const filter: any = getOrgBranchFilter(req);
    if (classId) filter.classId = new Types.ObjectId(classId);
    if (subjectId) filter.subjectId = new Types.ObjectId(subjectId);
    if (chapterId) filter.chapterId = new Types.ObjectId(chapterId);

    const engagement = await ContentProgress.aggregate([
      { $match: filter },
      { $group: {
        _id: '$contentId',
        uniqueStudents: { $addToSet: '$studentId' },
        totalViews: { $sum: '$accessCount' },
        completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalEntries: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' },
        avgVideoProgress: { $avg: '$videoProgress' }
      }},
      { $lookup: { from: 'lessoncontents', localField: '_id', foreignField: '_id', as: 'content' } },
      { $unwind: { path: '$content', preserveNullAndEmptyArrays: true } },
      { $project: {
        contentId: '$_id',
        title: '$content.title',
        contentType: '$content.contentType',
        studentCount: { $size: '$uniqueStudents' },
        totalViews: 1,
        completedCount: 1,
        totalEntries: 1,
        avgTimeSpent: 1,
        avgVideoProgress: 1,
        completionRate: { $cond: [{ $gt: ['$totalEntries', 0] }, { $multiply: [{ $divide: ['$completedCount', '$totalEntries'] }, 100] }, 0] }
      }},
      { $sort: { totalViews: -1 } }
    ]);

    res.json({ success: true, message: 'Content engagement report', data: engagement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════
// CONTENT CLONING & ROLLOVER
// ════════════════════════════════════════════════════════════════════

// POST /clone/subject-content — clone all chapters + content from one class/subject to another
router.post('/clone/subject-content', validate(Joi.object({
  sourceClassId: Joi.string().required(),
  sourceSubjectId: Joi.string().required(),
  targetClassId: Joi.string().required(),
  targetSubjectId: Joi.string().required(),
  includeAssessments: Joi.boolean().default(true)
})), async (req: AuthenticatedRequest, res) => {
  try {
    const { sourceClassId, sourceSubjectId, targetClassId, targetSubjectId, includeAssessments } = req.body;
    const orgBranch = getOrgBranchForCreate(req);
    const filter = getOrgBranchFilter(req);

    // 1. Clone chapters
    const sourceChapters = await Chapter.find({
      classId: new Types.ObjectId(sourceClassId),
      subjectId: new Types.ObjectId(sourceSubjectId),
      ...filter
    }).sort({ chapterNumber: 1 }).lean();

    if (sourceChapters.length === 0) {
      return res.status(404).json({ success: false, message: 'No chapters found in source' });
    }

    const chapterMap: Record<string, string> = {}; // old _id → new _id
    let clonedChapters = 0;
    let clonedContent = 0;
    let clonedAssessments = 0;

    for (const ch of sourceChapters) {
      const newChapter = await Chapter.create({
        subjectId: new Types.ObjectId(targetSubjectId),
        classId: new Types.ObjectId(targetClassId),
        name: ch.name,
        chapterNumber: ch.chapterNumber,
        description: ch.description,
        status: 'active',
        ...orgBranch,
        createdBy: req.user!._id
      });
      chapterMap[ch._id.toString()] = newChapter._id.toString();
      clonedChapters++;
    }

    // 2. Clone content
    const sourceContent = await LessonContent.find({
      classId: new Types.ObjectId(sourceClassId),
      subjectId: new Types.ObjectId(sourceSubjectId),
      ...filter
    }).lean();

    for (const content of sourceContent) {
      const chapterId = chapterMap[content.chapterId.toString()];
      if (!chapterId) continue;

      await LessonContent.create({
        chapterId: new Types.ObjectId(chapterId),
        subjectId: new Types.ObjectId(targetSubjectId),
        classId: new Types.ObjectId(targetClassId),
        title: content.title,
        contentType: content.contentType,
        body: content.body,
        fileUrl: content.fileUrl,
        fileName: content.fileName,
        fileSize: content.fileSize,
        mimeType: content.mimeType,
        externalUrl: content.externalUrl,
        thumbnailUrl: content.thumbnailUrl,
        duration: content.duration,
        sortOrder: content.sortOrder,
        status: 'draft',
        tags: content.tags,
        ...orgBranch,
        createdBy: req.user!._id
      });
      clonedContent++;
    }

    // 3. Clone assessments (optional)
    if (includeAssessments) {
      const sourceAssessments = await LmsAssessment.find({
        classId: new Types.ObjectId(sourceClassId),
        subjectId: new Types.ObjectId(sourceSubjectId),
        ...filter
      }).lean();

      for (const assessment of sourceAssessments) {
        const chapterId = assessment.chapterId ? chapterMap[assessment.chapterId.toString()] : undefined;

        await LmsAssessment.create({
          subjectId: new Types.ObjectId(targetSubjectId),
          classId: new Types.ObjectId(targetClassId),
          chapterId: chapterId ? new Types.ObjectId(chapterId) : undefined,
          title: assessment.title,
          assessmentType: assessment.assessmentType,
          instructions: assessment.instructions,
          totalMarks: assessment.totalMarks,
          passingMarks: assessment.passingMarks,
          duration: assessment.duration,
          questions: assessment.questions,
          settings: assessment.settings,
          status: 'draft',
          ...orgBranch,
          createdBy: req.user!._id
        });
        clonedAssessments++;
      }
    }

    res.status(201).json({
      success: true,
      message: `Cloned ${clonedChapters} chapters, ${clonedContent} content items${includeAssessments ? `, ${clonedAssessments} assessments` : ''}`,
      data: { clonedChapters, clonedContent, clonedAssessments }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /clone/chapter — clone a single chapter (with content) to another class/subject
router.post('/clone/chapter', validate(Joi.object({
  chapterId: Joi.string().required(),
  targetClassId: Joi.string().required(),
  targetSubjectId: Joi.string().required()
})), async (req: AuthenticatedRequest, res) => {
  try {
    const { chapterId, targetClassId, targetSubjectId } = req.body;
    const orgBranch = getOrgBranchForCreate(req);
    const filter = getOrgBranchFilter(req);

    const chapter = await Chapter.findOne({ _id: chapterId, ...filter }).lean();
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter was not found.' });
    }

    // Get max chapter number in target
    const maxCh = await Chapter.findOne({
      classId: new Types.ObjectId(targetClassId),
      subjectId: new Types.ObjectId(targetSubjectId),
      ...filter
    }).sort({ chapterNumber: -1 }).lean();

    const newChapter = await Chapter.create({
      subjectId: new Types.ObjectId(targetSubjectId),
      classId: new Types.ObjectId(targetClassId),
      name: chapter.name,
      chapterNumber: (maxCh?.chapterNumber || 0) + 1,
      description: chapter.description,
      status: 'active',
      ...orgBranch,
      createdBy: req.user!._id
    });

    // Clone content
    const content = await LessonContent.find({ chapterId: chapter._id, ...filter }).lean();
    let cloned = 0;
    for (const c of content) {
      await LessonContent.create({
        chapterId: newChapter._id,
        subjectId: new Types.ObjectId(targetSubjectId),
        classId: new Types.ObjectId(targetClassId),
        title: c.title,
        contentType: c.contentType,
        body: c.body,
        fileUrl: c.fileUrl,
        fileName: c.fileName,
        fileSize: c.fileSize,
        mimeType: c.mimeType,
        externalUrl: c.externalUrl,
        thumbnailUrl: c.thumbnailUrl,
        duration: c.duration,
        sortOrder: c.sortOrder,
        status: 'draft',
        tags: c.tags,
        ...orgBranch,
        createdBy: req.user!._id
      });
      cloned++;
    }

    res.status(201).json({
      success: true,
      message: `Chapter cloned with ${cloned} content items`,
      data: { chapter: newChapter, contentCloned: cloned }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /rollover — copy all LMS content from current context to a new academic year class setup
router.post('/rollover', validate(Joi.object({
  sourceClassId: Joi.string().required(),
  targetClassId: Joi.string().required(),
  subjectMappings: Joi.array().items(Joi.object({
    sourceSubjectId: Joi.string().required(),
    targetSubjectId: Joi.string().required()
  })).min(1).required(),
  includeAssessments: Joi.boolean().default(true)
})), async (req: AuthenticatedRequest, res) => {
  try {
    const { sourceClassId, targetClassId, subjectMappings, includeAssessments } = req.body;
    const orgBranch = getOrgBranchForCreate(req);
    const filter = getOrgBranchFilter(req);

    let totalChapters = 0;
    let totalContent = 0;
    let totalAssessments = 0;

    for (const mapping of subjectMappings) {
      const { sourceSubjectId, targetSubjectId } = mapping;

      // Clone chapters
      const chapters = await Chapter.find({
        classId: new Types.ObjectId(sourceClassId),
        subjectId: new Types.ObjectId(sourceSubjectId),
        ...filter
      }).sort({ chapterNumber: 1 }).lean();

      const chMap: Record<string, string> = {};

      for (const ch of chapters) {
        const newCh = await Chapter.create({
          subjectId: new Types.ObjectId(targetSubjectId),
          classId: new Types.ObjectId(targetClassId),
          name: ch.name,
          chapterNumber: ch.chapterNumber,
          description: ch.description,
          status: 'active',
          ...orgBranch,
          createdBy: req.user!._id
        });
        chMap[ch._id.toString()] = newCh._id.toString();
        totalChapters++;
      }

      // Clone content
      const content = await LessonContent.find({
        classId: new Types.ObjectId(sourceClassId),
        subjectId: new Types.ObjectId(sourceSubjectId),
        ...filter
      }).lean();

      for (const c of content) {
        const newChId = chMap[c.chapterId.toString()];
        if (!newChId) continue;
        await LessonContent.create({
          chapterId: new Types.ObjectId(newChId),
          subjectId: new Types.ObjectId(targetSubjectId),
          classId: new Types.ObjectId(targetClassId),
          title: c.title, contentType: c.contentType, body: c.body,
          fileUrl: c.fileUrl, fileName: c.fileName, fileSize: c.fileSize, mimeType: c.mimeType,
          externalUrl: c.externalUrl, thumbnailUrl: c.thumbnailUrl, duration: c.duration,
          sortOrder: c.sortOrder, status: 'draft', tags: c.tags,
          ...orgBranch, createdBy: req.user!._id
        });
        totalContent++;
      }

      // Clone assessments
      if (includeAssessments) {
        const assessments = await LmsAssessment.find({
          classId: new Types.ObjectId(sourceClassId),
          subjectId: new Types.ObjectId(sourceSubjectId),
          ...filter
        }).lean();

        for (const a of assessments) {
          const chId = a.chapterId ? chMap[a.chapterId.toString()] : undefined;
          await LmsAssessment.create({
            subjectId: new Types.ObjectId(targetSubjectId),
            classId: new Types.ObjectId(targetClassId),
            chapterId: chId ? new Types.ObjectId(chId) : undefined,
            title: a.title, assessmentType: a.assessmentType, instructions: a.instructions,
            totalMarks: a.totalMarks, passingMarks: a.passingMarks, duration: a.duration,
            questions: a.questions, settings: a.settings, status: 'draft',
            ...orgBranch, createdBy: req.user!._id
          });
          totalAssessments++;
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Rollover complete: ${totalChapters} chapters, ${totalContent} content, ${totalAssessments} assessments`,
      data: { totalChapters, totalContent, totalAssessments, subjectsMapped: subjectMappings.length }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════
// ORG → BRANCH IMPORT  &  CROSS-BRANCH IMPORT
// ════════════════════════════════════════════════════════════════════

// GET /import/available — list org-level content (branchId=null) available for import
router.get('/import/available', validateQuery(Joi.object({
  classId: Joi.string(),
  subjectId: Joi.string(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100)
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = req.user!.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization context required' });
    }

    const filter: any = { organizationId: orgId, branchId: null };
    if (req.query.classId) filter.classId = new Types.ObjectId(req.query.classId as string);
    if (req.query.subjectId) filter.subjectId = new Types.ObjectId(req.query.subjectId as string);

    const chapters = await Chapter.find(filter)
      .populate('subjectId', 'name')
      .populate('classId', 'name')
      .sort({ chapterNumber: 1 })
      .lean();

    // Count content per chapter
    const chapterIds = chapters.map(c => c._id);
    const contentCounts = await LessonContent.aggregate([
      { $match: { chapterId: { $in: chapterIds }, organizationId: orgId, branchId: null } },
      { $group: { _id: '$chapterId', count: { $sum: 1 } } }
    ]);
    const countMap: Record<string, number> = {};
    contentCounts.forEach((cc: any) => { countMap[cc._id.toString()] = cc.count; });

    const assessmentCount = await LmsAssessment.countDocuments({ organizationId: orgId, branchId: null, ...(req.query.classId ? { classId: req.query.classId } : {}) });

    const data = chapters.map(ch => ({
      ...ch,
      contentCount: countMap[ch._id.toString()] || 0
    }));

    res.json({ success: true, message: 'Available org-level content', data, meta: { assessmentCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /import/branches — list branches in org with their LMS content counts (for cross-branch import)
router.get('/import/branches', async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = req.user!.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization context required' });
    }

    // Only org_admin or branch_admin can see other branches
    if (!['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    const { Branch } = await import('../models/Branch');
    const branches = await Branch.find({ organizationId: orgId, status: 'active' }).select('name code').lean();

    // Count chapters per branch
    const chapterCounts = await Chapter.aggregate([
      { $match: { organizationId: new Types.ObjectId(orgId as string), branchId: { $ne: null } } },
      { $group: { _id: '$branchId', count: { $sum: 1 } } }
    ]);
    const countMap: Record<string, number> = {};
    chapterCounts.forEach((cc: any) => { countMap[cc._id.toString()] = cc.count; });

    const data = branches.map((b: any) => ({
      _id: b._id,
      name: b.name,
      code: b.code,
      chapterCount: countMap[b._id.toString()] || 0
    }));

    res.json({ success: true, message: 'Branches with LMS content', data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /import/from-org — import org-level content into a branch
router.post('/import/from-org', validate(Joi.object({
  targetBranchId: Joi.string().required(),
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  includeAssessments: Joi.boolean().default(true)
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = req.user!.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization context required' });
    }

    // Only org_admin can push org content to branches
    if (!['platform_admin', 'org_admin'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Only org admins can import org content to branches' });
    }

    const { targetBranchId, subjectId, classId, includeAssessments } = req.body;

    // Verify target branch belongs to same org
    const { Branch } = await import('../models/Branch');
    const branch = await Branch.findOne({ _id: targetBranchId, organizationId: orgId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Target branch not found in your organization' });
    }

    // Find org-level content (branchId = null)
    const sourceChapters = await Chapter.find({
      organizationId: orgId,
      branchId: null,
      subjectId: new Types.ObjectId(subjectId),
      classId: new Types.ObjectId(classId)
    }).sort({ chapterNumber: 1 }).lean();

    if (sourceChapters.length === 0) {
      return res.status(404).json({ success: false, message: 'No org-level chapters found for this subject/class' });
    }

    const chapterMap: Record<string, string> = {};
    let clonedChapters = 0, clonedContent = 0, clonedAssessments = 0;

    for (const ch of sourceChapters) {
      const newCh = await Chapter.create({
        subjectId: ch.subjectId,
        classId: ch.classId,
        name: ch.name,
        chapterNumber: ch.chapterNumber,
        description: ch.description,
        status: 'active',
        organizationId: orgId,
        branchId: new Types.ObjectId(targetBranchId),
        createdBy: req.user!._id
      });
      chapterMap[ch._id.toString()] = newCh._id.toString();
      clonedChapters++;
    }

    // Clone content
    const sourceContent = await LessonContent.find({
      organizationId: orgId,
      branchId: null,
      subjectId: new Types.ObjectId(subjectId),
      classId: new Types.ObjectId(classId)
    }).lean();

    for (const c of sourceContent) {
      const newChId = chapterMap[c.chapterId.toString()];
      if (!newChId) continue;
      await LessonContent.create({
        chapterId: new Types.ObjectId(newChId),
        subjectId: c.subjectId, classId: c.classId,
        title: c.title, contentType: c.contentType, body: c.body,
        fileUrl: c.fileUrl, fileName: c.fileName, fileSize: c.fileSize, mimeType: c.mimeType,
        externalUrl: c.externalUrl, thumbnailUrl: c.thumbnailUrl, duration: c.duration,
        sortOrder: c.sortOrder, status: 'draft', tags: c.tags,
        organizationId: orgId, branchId: new Types.ObjectId(targetBranchId), createdBy: req.user!._id
      });
      clonedContent++;
    }

    if (includeAssessments) {
      const sourceAssessments = await LmsAssessment.find({
        organizationId: orgId, branchId: null,
        subjectId: new Types.ObjectId(subjectId), classId: new Types.ObjectId(classId)
      }).lean();

      for (const a of sourceAssessments) {
        const chId = a.chapterId ? chapterMap[a.chapterId.toString()] : undefined;
        await LmsAssessment.create({
          subjectId: a.subjectId, classId: a.classId,
          chapterId: chId ? new Types.ObjectId(chId) : undefined,
          title: a.title, assessmentType: a.assessmentType, instructions: a.instructions,
          totalMarks: a.totalMarks, passingMarks: a.passingMarks, duration: a.duration,
          questions: a.questions, settings: a.settings, status: 'draft',
          organizationId: orgId, branchId: new Types.ObjectId(targetBranchId), createdBy: req.user!._id
        });
        clonedAssessments++;
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${clonedChapters} chapters, ${clonedContent} content, ${clonedAssessments} assessments to branch`,
      data: { clonedChapters, clonedContent, clonedAssessments }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /import/from-branch — import content from one branch to another within same org
router.post('/import/from-branch', validate(Joi.object({
  sourceBranchId: Joi.string().required(),
  targetBranchId: Joi.string().required(),
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  includeAssessments: Joi.boolean().default(true)
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = req.user!.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization context required' });
    }

    // Only org_admin or branch_admin can do cross-branch import
    if (!['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions for cross-branch import' });
    }

    const { sourceBranchId, targetBranchId, subjectId, classId, includeAssessments } = req.body;

    if (sourceBranchId === targetBranchId) {
      return res.status(400).json({ success: false, message: 'Source and target branch cannot be the same' });
    }

    // Branch_admin can only import INTO their own branch
    if (req.user!.role === 'branch_admin') {
      const userBranchId = req.user!.branchId?.toString();
      if (targetBranchId !== userBranchId) {
        return res.status(403).json({ success: false, message: 'Branch admins can only import into their own branch' });
      }
    }

    // Verify both branches belong to same org
    const { Branch } = await import('../models/Branch');
    const [srcBranch, tgtBranch] = await Promise.all([
      Branch.findOne({ _id: sourceBranchId, organizationId: orgId }),
      Branch.findOne({ _id: targetBranchId, organizationId: orgId })
    ]);
    if (!srcBranch || !tgtBranch) {
      return res.status(404).json({ success: false, message: 'Source or target branch not found in your organization' });
    }

    // Find source branch content
    const sourceChapters = await Chapter.find({
      organizationId: orgId,
      branchId: new Types.ObjectId(sourceBranchId),
      subjectId: new Types.ObjectId(subjectId),
      classId: new Types.ObjectId(classId)
    }).sort({ chapterNumber: 1 }).lean();

    if (sourceChapters.length === 0) {
      return res.status(404).json({ success: false, message: 'No chapters found in source branch for this subject/class' });
    }

    const chapterMap: Record<string, string> = {};
    let clonedChapters = 0, clonedContent = 0, clonedAssessments = 0;

    for (const ch of sourceChapters) {
      const newCh = await Chapter.create({
        subjectId: ch.subjectId, classId: ch.classId,
        name: ch.name, chapterNumber: ch.chapterNumber, description: ch.description,
        status: 'active', organizationId: orgId,
        branchId: new Types.ObjectId(targetBranchId), createdBy: req.user!._id
      });
      chapterMap[ch._id.toString()] = newCh._id.toString();
      clonedChapters++;
    }

    const sourceContent = await LessonContent.find({
      organizationId: orgId, branchId: new Types.ObjectId(sourceBranchId),
      subjectId: new Types.ObjectId(subjectId), classId: new Types.ObjectId(classId)
    }).lean();

    for (const c of sourceContent) {
      const newChId = chapterMap[c.chapterId.toString()];
      if (!newChId) continue;
      await LessonContent.create({
        chapterId: new Types.ObjectId(newChId),
        subjectId: c.subjectId, classId: c.classId,
        title: c.title, contentType: c.contentType, body: c.body,
        fileUrl: c.fileUrl, fileName: c.fileName, fileSize: c.fileSize, mimeType: c.mimeType,
        externalUrl: c.externalUrl, thumbnailUrl: c.thumbnailUrl, duration: c.duration,
        sortOrder: c.sortOrder, status: 'draft', tags: c.tags,
        organizationId: orgId, branchId: new Types.ObjectId(targetBranchId), createdBy: req.user!._id
      });
      clonedContent++;
    }

    if (includeAssessments) {
      const sourceAssessments = await LmsAssessment.find({
        organizationId: orgId, branchId: new Types.ObjectId(sourceBranchId),
        subjectId: new Types.ObjectId(subjectId), classId: new Types.ObjectId(classId)
      }).lean();

      for (const a of sourceAssessments) {
        const chId = a.chapterId ? chapterMap[a.chapterId.toString()] : undefined;
        await LmsAssessment.create({
          subjectId: a.subjectId, classId: a.classId,
          chapterId: chId ? new Types.ObjectId(chId) : undefined,
          title: a.title, assessmentType: a.assessmentType, instructions: a.instructions,
          totalMarks: a.totalMarks, passingMarks: a.passingMarks, duration: a.duration,
          questions: a.questions, settings: a.settings, status: 'draft',
          organizationId: orgId, branchId: new Types.ObjectId(targetBranchId), createdBy: req.user!._id
        });
        clonedAssessments++;
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${clonedChapters} chapters, ${clonedContent} content, ${clonedAssessments} assessments from ${srcBranch.name}`,
      data: { clonedChapters, clonedContent, clonedAssessments }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════
// QUESTION POOL
// ════════════════════════════════════════════════════════════════════

const questionPoolItemSchema = Joi.object({
  questionText: Joi.string().required(),
  questionType: Joi.string().valid('mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank').required(),
  options: Joi.array().items(Joi.object({
    optionId: Joi.string().required(),
    text: Joi.string().required(),
    isCorrect: Joi.boolean().default(false)
  })).default([]),
  correctAnswer: Joi.string().optional().allow(''),
  marks: Joi.number().min(0).default(1),
  explanation: Joi.string().optional().allow(''),
  imageUrl: Joi.string().optional().allow(''),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  tags: Joi.array().items(Joi.string()).default([])
});

// GET /question-pools
router.get('/question-pools', checkPermission('classes', 'read'), validateQuery(Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  search: Joi.string().optional().allow(''),
  subjectId: Joi.string().optional().allow(''),
  classId: Joi.string().optional().allow(''),
  chapterId: Joi.string().optional().allow('')
})), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 50, search = '', subjectId = '', classId = '', chapterId = '' } = req.query as any;
    const filter: any = {};
    Object.assign(filter, getLmsReadFilter(req));
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (subjectId && Types.ObjectId.isValid(subjectId)) filter.subjectId = new Types.ObjectId(subjectId);
    if (classId && Types.ObjectId.isValid(classId)) filter.classId = new Types.ObjectId(classId);
    if (chapterId && Types.ObjectId.isValid(chapterId)) filter.chapterId = new Types.ObjectId(chapterId);

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      QuestionPool.find(filter)
        .populate('subjectId', 'name code')
        .populate('classId', 'name')
        .populate('chapterId', 'name chapterNumber')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)).lean(),
      QuestionPool.countDocuments(filter)
    ]);

    // Return pool summaries (question count, not full questions)
    const summaries = data.map(p => ({
      ...p,
      questionCount: p.questions?.length || 0,
      questions: undefined,
      difficultyBreakdown: {
        easy: p.questions?.filter((q: any) => q.difficulty === 'easy').length || 0,
        medium: p.questions?.filter((q: any) => q.difficulty === 'medium').length || 0,
        hard: p.questions?.filter((q: any) => q.difficulty === 'hard').length || 0
      }
    }));

    res.json({
      success: true, message: 'Question pools', data: summaries,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /question-pools/:id
router.get('/question-pools/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getLmsReadFilter(req));
    const pool = await QuestionPool.findOne(filter)
      .populate('subjectId', 'name code')
      .populate('classId', 'name')
      .populate('chapterId', 'name chapterNumber');
    if (!pool) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: pool });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /question-pools
router.post('/question-pools', checkPermission('classes', 'create'), validate(Joi.object({
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  chapterId: Joi.string().optional().allow('', null),
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow(''),
  questions: Joi.array().items(questionPoolItemSchema).default([])
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgBranch = getOrgBranchForCreate(req);
    const pool = await QuestionPool.create({
      ...req.body,
      chapterId: req.body.chapterId || undefined,
      ...orgBranch,
      createdBy: req.user!._id
    });
    res.status(201).json({ success: true, message: 'Question pool created', data: pool });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /question-pools/:id
router.put('/question-pools/:id', checkPermission('classes', 'update'), validate(Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow(''),
  chapterId: Joi.string().optional().allow('', null),
  questions: Joi.array().items(questionPoolItemSchema).optional()
})), async (req: AuthenticatedRequest, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));
    const pool = await QuestionPool.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!pool) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Question pool updated', data: pool });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /question-pools/:id
router.delete('/question-pools/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));
    const pool = await QuestionPool.findOneAndDelete(filter);
    if (!pool) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Question pool deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /question-pools/:id/add-questions — bulk add questions to pool
router.post('/question-pools/:id/add-questions', checkPermission('classes', 'update'), validate(Joi.object({
  questions: Joi.array().items(questionPoolItemSchema).min(1).required()
})), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));
    const pool = await QuestionPool.findOneAndUpdate(
      filter,
      { $push: { questions: { $each: req.body.questions } } },
      { new: true }
    );
    if (!pool) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: `${req.body.questions.length} questions added`, data: pool });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /question-pools/:id/generate — pick random questions from pool for assessment
router.post('/question-pools/:id/generate', checkPermission('classes', 'read'), validate(Joi.object({
  count: Joi.number().integer().min(1).required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard', 'mixed').default('mixed'),
  questionTypes: Joi.array().items(Joi.string().valid('mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank')).optional()
})), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getLmsReadFilter(req));
    const pool = await QuestionPool.findOne(filter).lean();
    if (!pool) return res.status(404).json({ success: false, message: 'Not found' });

    let candidates = pool.questions || [];
    const { count, difficulty, questionTypes } = req.body;

    if (difficulty && difficulty !== 'mixed') {
      candidates = candidates.filter(q => q.difficulty === difficulty);
    }
    if (questionTypes && questionTypes.length > 0) {
      candidates = candidates.filter(q => questionTypes.includes(q.questionType));
    }
    if (candidates.length === 0) {
      return res.status(400).json({ success: false, message: 'No matching questions found in pool' });
    }

    // Shuffle and pick
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Convert to assessment question format
    const questions = selected.map((q, idx) => ({
      questionNumber: idx + 1,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      explanation: q.explanation,
      imageUrl: q.imageUrl
    }));

    res.json({
      success: true,
      message: `Generated ${questions.length} questions from pool`,
      data: { questions, totalMarks: questions.reduce((s, q) => s + q.marks, 0) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
