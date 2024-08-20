import Joi from "joi";

export  function validateLogin(login) {
  const JoiSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }).options({ abortEarly: false });
  return JoiSchema.validate(login);
}

export function validatePost(post) {
  const JoiSchema = Joi.object({
    accounts: Joi.array().items(Joi.string()).required(),
    text: Joi.string().optional(),
    attachment: Joi.array().items(Joi.string()).optional().default([]),
    datetime: Joi.date().iso().required(),
  }).options({ abortEarly: false });
  return JoiSchema.validate(post);
}

export function isNumeric(str) {
  if (typeof str != "string") return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

export function isString(data) {
  if (typeof data != "string") return false;
  return true;
}
