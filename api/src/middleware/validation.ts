import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

// Field display names for clear error messages
const fieldLabels: Record<string, string> = {
  admissionNo: 'Admission Number',
  employeeId: 'Employee ID',
  name: 'Full Name',
  dateOfBirth: 'Date of Birth',
  dateOfAdmission: 'Date of Admission',
  dateOfJoining: 'Date of Joining',
  fatherName: "Father's Name",
  fatherPhone: "Father's Phone",
  fatherEmail: "Father's Email",
  fatherJobCompany: "Father's Job & Company",
  motherName: "Mother's Name",
  motherPhone: "Mother's Phone",
  motherEmail: "Mother's Email",
  motherJobCompany: "Mother's Job & Company",
  guardianName: 'Guardian Name',
  guardianPhone: 'Guardian Phone',
  guardianEmail: 'Guardian Email',
  classId: 'Class',
  class: 'Class',
  section: 'Division/Section',
  gender: 'Gender',
  address: 'Address',
  transport: 'Transport Mode',
  transportRoute: 'Transport Route',
  phone: 'Phone Number',
  email: 'Email Address',
  mobile: 'Mobile Number',
  pin: 'PIN',
  salary: 'Monthly Salary',
  designation: 'Designation',
  department: 'Department',
  category: 'Staff Category',
  status: 'Status',
  organizationId: 'Organization',
  branchId: 'Branch',
  academicYear: 'Academic Year',
  academicYearId: 'Academic Year',
  date: 'Date',
  fromDate: 'From Date',
  toDate: 'To Date',
  reason: 'Reason',
  routeName: 'Route Name',
  routeCode: 'Route Code',
  vehicleNumber: 'Vehicle Number',
  driverName: 'Driver Name',
  driverPhone: 'Driver Phone',
  subjectId: 'Subject',
  staffId: 'Staff',
  configId: 'Timetable Config',
  divisionId: 'Division',
  studentId: 'Student',
  records: 'Attendance Records',
};

function getFieldLabel(field: string): string {
  return fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

/**
 * Transform a raw Joi message into a clear, user-friendly message.
 */
function humanizeMessage(detail: Joi.ValidationErrorItem): string {
  const field = detail.path.join('.');
  const label = getFieldLabel(field);
  const type = detail.type;

  // If a custom .messages() was set on the schema, use it as-is
  if (detail.message && !detail.message.startsWith('"')) {
    return detail.message;
  }

  switch (type) {
    case 'any.required':
      return `${label} is required.`;
    case 'string.empty':
      return `${label} cannot be empty.`;
    case 'string.min':
      return `${label} must be at least ${detail.context?.limit} characters.`;
    case 'string.max':
      return `${label} must not exceed ${detail.context?.limit} characters.`;
    case 'string.email':
      return `Please enter a valid email address for ${label}.`;
    case 'string.pattern.base':
      return detail.message.startsWith('"') ? `${label} format is invalid.` : detail.message;
    case 'string.base':
      return `${label} must be a text value.`;
    case 'number.base':
      return `${label} must be a number.`;
    case 'number.min':
      return `${label} must be at least ${detail.context?.limit}.`;
    case 'number.max':
      return `${label} must not exceed ${detail.context?.limit}.`;
    case 'date.base':
      return `${label} must be a valid date.`;
    case 'date.min':
      return `${label} must be on or after the start date.`;
    case 'any.only':
      return `${label} has an invalid value. Allowed: ${(detail.context?.valids || []).join(', ')}.`;
    case 'array.min':
      return `At least ${detail.context?.limit} item(s) required for ${label}.`;
    case 'array.base':
      return `${label} must be a list.`;
    case 'object.unknown':
      return `Unknown field: "${field}".`;
    default:
      // Fallback: clean up Joi's default quoted-field format
      return detail.message.replace(/^"([^"]+)"/, (_, f: string) => getFieldLabel(f));
  }
}

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: humanizeMessage(detail)
      }));
      
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed: ' + errors.map(e => e.message).join(' '),
        error: errors.length === 1 ? errors[0].message : errors.map(e => e.message).join(' '),
        errors: errors.length > 1 ? errors : undefined
      };
      
      res.status(400).json(response);
      return;
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, allowUnknown: true });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: humanizeMessage(detail)
      }));
      
      const response: ApiResponse = {
        success: false,
        message: 'Invalid query: ' + errors.map(e => e.message).join(' '),
        error: errors.length === 1 ? errors[0].message : errors.map(e => e.message).join(' '),
        errors: errors.length > 1 ? errors : undefined
      };
      
      res.status(400).json(response);
      return;
    }
    
    // Replace req.query with validated and converted values
    req.query = value;
    next();
  };
};