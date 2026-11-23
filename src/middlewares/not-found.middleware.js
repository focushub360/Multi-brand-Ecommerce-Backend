import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.method} ${req.originalUrl} on this server`));
};

