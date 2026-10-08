import { Router } from 'express';
import { generateCopy } from '../services/copy.service.js';
import { asyncHandler, sendData, sendError, zodIssues } from '../utils/http.js';
import { copyRequestSchema } from './schemas.js';

const router = Router();

router.post(
  '/generate',
  asyncHandler(async (req, res) => {
    const parsed = copyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 422, 'Describe your product and audience first', zodIssues(parsed.error));
    }
    sendData(res, await generateCopy(parsed.data));
  })
);

export default router;
