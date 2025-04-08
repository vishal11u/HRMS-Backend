import Joi from "joi";

export const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().required().min(3).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    role: Joi.string().required().valid("Super Admin", "Admin", "HR Manager", "Manager")
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: error.details[0].message
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    emailOrUsername: Joi.string().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: error.details[0].message
    });
  }
  next();
};

export const validatePasswordReset = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().required().min(6)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: error.details[0].message
    });
  }
  next();
}; 