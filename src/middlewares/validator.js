import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

export const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            throw new ValidationError(errorMessage);
        }

        next();
    };
};

// Common validation schemas
export const schemas = {
    id: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }),

    dateRange: Joi.object({
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
    }),

    search: Joi.object({
        search: Joi.string().min(1).max(100)
    })
}; 