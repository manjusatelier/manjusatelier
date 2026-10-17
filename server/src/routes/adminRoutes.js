import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { getStats, getCustomers, uploadImage, sendBroadcastEmail, downloadStallQrPdf } from '../controllers/adminController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const router = Router();

router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/customers', getCustomers);
router.post('/upload', upload.single('image'), uploadImage);
router.post('/marketing/broadcast', sendBroadcastEmail);
router.get('/marketing/stall-qr-pdf', downloadStallQrPdf);

export { uploadDir };
export default router;
