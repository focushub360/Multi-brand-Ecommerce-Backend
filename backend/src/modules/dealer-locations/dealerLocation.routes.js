import { Router } from 'express';
import * as dealerLocationController from './dealerLocation.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createLocationSchema,
  serviceabilityCheckSchema
} from './dealerLocation.validation.js';

const router = Router();

/**
 * Public Customer Geospatial Serviceability Endpoints
 */
router.get('/nearby', dealerLocationController.findNearbyHubs);
router.post(
  '/check-serviceability',
  validate(serviceabilityCheckSchema),
  dealerLocationController.checkServiceability
);

/**
 * Super Admin Management Endpoints
 */
router.get(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  dealerLocationController.getAllLocations
);

router.post(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validate(createLocationSchema),
  dealerLocationController.createLocation
);

router.put(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  dealerLocationController.updateLocation
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  dealerLocationController.deleteLocation
);

export default router;

