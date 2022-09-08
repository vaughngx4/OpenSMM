const Joi = require("joi");

function validatePost(post) {
  const JoiSchema = Joi.object({
    accounts: {
      twitter: Joi.array().required(), // change to optional when more platforms are added
    },
    text: Joi.string().optional(),
    attachment: Joi.string().optional(),
    datetime: Joi.date().required(),
    pollDuration: Joi.number().optional(),
    pollOptions: Joi.array().optional(),
  }).options({ abortEarly: false });
  return JoiSchema.validate(post);
}

function validateUser(user) {}

module.exports = { validatePost };
