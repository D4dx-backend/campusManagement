import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/logos';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: branchId_timestamp.ext
    const branchId = req.body.branchId || 'default';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${branchId}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
    }
  }
});

// @desc    Upload logo file
// @route   POST /api/upload/logo
// @access  Private
router.post('/logo', (req: AuthenticatedRequest, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      const response: ApiResponse = {
        success: false,
        message: err.message || 'File upload error'
      };
      return res.status(400).json(response);
    }
    next();
  });
}, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        message: 'No file uploaded'
      };
      return res.status(400).json(response);
    }

    // Generate the logo path (relative to public directory)
    const logoPath = `/uploads/logos/${req.file.filename}`;

    const response: ApiResponse = {
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoPath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Logo upload error:', error);
    
    let message = 'Server error uploading logo';
    if (error instanceof Error) {
      message = error.message;
    }

    const response: ApiResponse = {
      success: false,
      message
    };
    res.status(500).json(response);
  }
});

// @desc    Delete logo file
// @route   DELETE /api/upload/logo/:filename
// @access  Private
router.delete('/logo/:filename', async (req: AuthenticatedRequest, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/logos', filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Logo deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Logo delete error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting logo'
    };
    res.status(500).json(response);
  }
});

// @desc    Test upload endpoint (for debugging)
// @route   POST /api/upload/test
// @access  Private
router.post('/test', upload.single('logo'), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('=== UPLOAD TEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Headers:', req.headers);
    
    const response: ApiResponse = {
      success: true,
      message: 'Upload test successful',
      data: {
        hasFile: !!req.file,
        body: req.body,
        file: req.file ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Upload test error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Upload test failed'
    };
    res.status(500).json(response);
  }
});

export default router;