import express from 'express';
import multer from 'multer';
import { uploadResume, generatePortfolio, downloadPortfolio } from '../controllers/apiController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

router.post('/upload-resume', upload.single('resume'), uploadResume);
router.post('/generate-portfolio', generatePortfolio);
router.get('/download-portfolio', downloadPortfolio);

export default router; 