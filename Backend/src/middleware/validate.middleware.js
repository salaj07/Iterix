const { validationResult } = require("express-validator");

/**
 * Reads validation results and returns a 422 with field-level error details
 * if any validators failed. Call this middleware AFTER your validator chain.
 *
 * @example
 *   router.post("/", [body("name").notEmpty()], validate, controller.create);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
};

module.exports = { validate };
