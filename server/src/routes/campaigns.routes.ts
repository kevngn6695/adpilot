import { Router } from 'express';
import {
  createCampaign,
  dailySeries,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateStatus,
} from '../services/campaigns.service.js';
import { asyncHandler, parseId, sendData, sendError, zodIssues } from '../utils/http.js';
import { newCampaignSchema, rangeQuerySchema, seriesQuerySchema, statusSchema } from './schemas.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = rangeQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, 'Invalid range', zodIssues(parsed.error));
    sendData(res, await listCampaigns(parsed.data.days));
  })
);

router.get(
  '/series',
  asyncHandler(async (req, res) => {
    const parsed = seriesQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, 'Invalid query', zodIssues(parsed.error));
    sendData(res, await dailySeries(parsed.data.days, parsed.data.metric));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, 'Campaign id must be a positive number');
    const campaign = await getCampaign(id);
    if (!campaign) return sendError(res, 404, 'Campaign not found');
    sendData(res, campaign);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = newCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 422, 'Some campaign details need fixing', zodIssues(parsed.error));
    }
    sendData(res, await createCampaign(parsed.data), 201);
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, 'Campaign id must be a positive number');
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 422, 'Status must be active or paused');
    const campaign = await updateStatus(id, parsed.data.status);
    if (!campaign) return sendError(res, 404, 'Campaign not found');
    sendData(res, campaign);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, 'Campaign id must be a positive number');
    if (!(await deleteCampaign(id))) return sendError(res, 404, 'Campaign not found');
    res.status(204).end();
  })
);

export default router;
