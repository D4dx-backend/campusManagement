import Joi from 'joi';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const slotSchema = Joi.object({
  slotNumber: Joi.number().integer().min(1).required(),
  type: Joi.string().valid('period', 'break').required(),
  label: Joi.string().required().trim(),
  startTime: Joi.string().pattern(timePattern).required().messages({
    'string.pattern.base': 'startTime must be in HH:mm format',
  }),
  endTime: Joi.string().pattern(timePattern).required().messages({
    'string.pattern.base': 'endTime must be in HH:mm format',
  }),
});

const dayScheduleSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  slots: Joi.array().items(slotSchema).min(1).required(),
});

// ── TimetableConfig schemas ──

export const createTimetableConfigSchema = Joi.object({
  name: Joi.string().required().trim(),
  academicYearId: Joi.string().required(),
  workingDays: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).required(),
  daySchedules: Joi.array().items(dayScheduleSchema).min(1).required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  branchId: Joi.string().optional(),
});

export const updateTimetableConfigSchema = Joi.object({
  name: Joi.string().optional().trim(),
  academicYearId: Joi.string().optional(),
  workingDays: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).optional(),
  daySchedules: Joi.array().items(dayScheduleSchema).min(1).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

export const queryTimetableConfigSchema = Joi.object({
  page: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom((v) => parseInt(v, 10)))
    .default(1),
  limit: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(100),
      Joi.string().pattern(/^\d+$/).custom((v) => Math.min(parseInt(v, 10), 100))
    )
    .default(10),
  search: Joi.string().optional().allow(''),
  academicYearId: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  branchId: Joi.string().optional().allow(''),
});

// ── Timetable schemas ──

const entrySchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  slotNumber: Joi.number().integer().min(1).required(),
  subjectId: Joi.string().required(),
  subjectName: Joi.string().required().trim(),
  staffId: Joi.string().required(),
  staffName: Joi.string().required().trim(),
});

export const createTimetableSchema = Joi.object({
  classId: Joi.string().required(),
  divisionId: Joi.string().required(),
  academicYearId: Joi.string().required(),
  configId: Joi.string().required(),
  entries: Joi.array().items(entrySchema).default([]),
  effectiveFrom: Joi.date().iso().optional(),
  status: Joi.string().valid('draft', 'active').default('draft'),
  branchId: Joi.string().optional(),
});

export const updateTimetableSchema = Joi.object({
  entries: Joi.array().items(entrySchema).optional(),
  effectiveFrom: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid('draft').optional(),
});

export const cloneTimetableSchema = Joi.object({
  targetClassId: Joi.string().required(),
  targetDivisionId: Joi.string().required(),
});

export const checkConflictsSchema = Joi.object({
  configId: Joi.string().required(),
  academicYearId: Joi.string().required(),
  entries: Joi.array().items(entrySchema).min(1).required(),
  excludeTimetableId: Joi.string().optional(),
});

export const queryTimetableSchema = Joi.object({
  page: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom((v) => parseInt(v, 10)))
    .default(1),
  limit: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(100),
      Joi.string().pattern(/^\d+$/).custom((v) => Math.min(parseInt(v, 10), 100))
    )
    .default(10),
  classId: Joi.string().optional().allow(''),
  divisionId: Joi.string().optional().allow(''),
  academicYearId: Joi.string().optional().allow(''),
  status: Joi.string().valid('draft', 'active', 'archived').optional(),
  branchId: Joi.string().optional().allow(''),
});

// ── Auto-generate schemas ──

const subjectTeacherMappingSchema = Joi.object({
  subjectId: Joi.string().required(),
  subjectName: Joi.string().required().trim(),
  staffId: Joi.string().required(),
  staffName: Joi.string().required().trim(),
  periodsPerWeek: Joi.number().integer().min(1).max(30).required(),
});

export const autoGenerateSchema = Joi.object({
  classId: Joi.string().required(),
  divisionId: Joi.string().required(),
  academicYearId: Joi.string().required(),
  configId: Joi.string().required(),
  subjectTeacherMappings: Joi.array().items(subjectTeacherMappingSchema).min(1).required(),
  useAI: Joi.boolean().default(false),
});
