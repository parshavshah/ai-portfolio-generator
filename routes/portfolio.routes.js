import express from 'express';
import { previewPortfolio } from '../controllers/portfolioController.js';

const router = express.Router();

router.get('/preview', previewPortfolio);

export default router; 