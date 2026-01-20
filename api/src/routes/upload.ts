import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { doSpacesService } from '../services/doSpacesService';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Configure multer to use memory storage (files stored in buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (increased from 2MB)
  },
  fileFilter: (req, file, cb) => {
    // Check file type - support more image formats
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP, SVG) are allowed'));
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

    const branchId = req.body.branchId || req.user?.branchId?.toString();

    // Upload to DigitalOcean Spaces - NO FALLBACK TO LOCAL STORAGE
    const uploadResult = await doSpacesService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      branchId
    );

    if (!uploadResult.success || !uploadResult.cdnUrl) {
      console.error('CDN upload failed:', uploadResult.message);
      const response: ApiResponse = {
        success: false,
        message: uploadResult.message || 'Failed to upload file to CDN. Please check your DigitalOcean Spaces configuration.'
      };
      return res.status(500).json(response);
    }

    // Validate that we got a CDN URL (not a local path)
    if (uploadResult.cdnUrl.startsWith('/uploads/') || uploadResult.cdnUrl.startsWith('uploads/')) {
      console.error('CDN configuration error: Received local path instead of CDN URL');
      const response: ApiResponse = {
        success: false,
        message: 'CDN configuration error: Received local path. Please check your DigitalOcean Spaces environment variables.'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Logo uploaded successfully to CDN',
      data: {
        logoPath: uploadResult.cdnUrl, // Use CDN URL as the primary path
        cdnUrl: uploadResult.cdnUrl,
        directUrl: uploadResult.url,
        key: uploadResult.key,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Logo upload error:', error instanceof Error ? error.message : 'Unknown error');
    
    let message = 'Server error uploading logo';
    if (error instanceof Error) {
      message = error.message;
    }

    const response: ApiResponse = {
      success: false,
      message: `CDN upload failed: ${message}. Please check your DigitalOcean Spaces configuration.`
    };
    res.status(500).json(response);
  }
});

// @desc    Delete logo file from CDN
// @route   DELETE /api/upload/logo/:key
// @access  Private
router.delete('/logo/:key(*)', async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;

    if (!key) {
      const response: ApiResponse = {
        success: false,
        message: 'File key is required'
      };
      return res.status(400).json(response);
    }

    // Delete from DigitalOcean Spaces
    const deleteResult = await doSpacesService.deleteFile(key);

    if (!deleteResult.success) {
      const response: ApiResponse = {
        success: false,
        message: deleteResult.message || 'Failed to delete file from CDN'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Logo deleted successfully from CDN'
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

// @desc    Delete logo by URL
// @route   POST /api/upload/logo/delete-by-url
// @access  Private
router.post('/logo/delete-by-url', async (req: AuthenticatedRequest, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      const response: ApiResponse = {
        success: false,
        message: 'URL is required'
      };
      return res.status(400).json(response);
    }

    // Delete from DigitalOcean Spaces by URL
    const deleteResult = await doSpacesService.deleteFileByUrl(url);

    if (!deleteResult.success) {
      const response: ApiResponse = {
        success: false,
        message: deleteResult.message || 'Failed to delete file from CDN'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Logo deleted successfully from CDN'
    };

    res.json(response);
  } catch (error) {
    console.error('Logo delete by URL error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting logo'
    };
    res.status(500).json(response);
  }
});

// @desc    List files in CDN
// @route   GET /api/upload/files
// @access  Private
router.get('/files', async (req: AuthenticatedRequest, res) => {
  try {
    const prefix = req.query.prefix as string | undefined;
    const branchId = req.query.branchId as string | undefined;

    // List files from DigitalOcean Spaces
    const listResult = await doSpacesService.listFiles(branchId || prefix);

    if (!listResult.success) {
      const response: ApiResponse = {
        success: false,
        message: listResult.message || 'Failed to list files from CDN'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: listResult.message || 'Files retrieved successfully',
      data: {
        files: listResult.files,
        count: listResult.files?.length || 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('List files error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error listing files'
    };
    res.status(500).json(response);
  }
});

// @desc    Check if file exists in CDN
// @route   POST /api/upload/check-file
// @access  Private
router.post('/check-file', async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      const response: ApiResponse = {
        success: false,
        message: 'File key is required'
      };
      return res.status(400).json(response);
    }

    const exists = await doSpacesService.fileExists(key);

    const response: ApiResponse = {
      success: true,
      message: exists ? 'File exists' : 'File not found',
      data: { exists }
    };

    res.json(response);
  } catch (error) {
    console.error('Check file error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error checking file'
    };
    res.status(500).json(response);
  }
});

// @desc    Test upload endpoint (for debugging)
// @route   POST /api/upload/test
// @access  Private
router.post('/test', upload.single('logo'), async (req: AuthenticatedRequest, res) => {
  try {
    const response: ApiResponse = {
      success: true,
      message: 'Upload test successful - CDN configured',
      data: {
        hasFile: !!req.file,
        body: req.body,
        file: req.file ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer_size: req.file.buffer.length
        } : null,
        cdnConfig: {
          bucket: process.env.DO_SPACES_BUCKET,
          endpoint: process.env.DO_SPACES_ENDPOINT,
          cdnEndpoint: process.env.DO_SPACES_CDN_ENDPOINT,
          folder: process.env.DO_SPACES_FOLDER
        }
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