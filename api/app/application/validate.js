const Joi = require("joi");

function validateTwitterAccount(account) {
  const JoiSchema = Joi.object({
    accountName: Joi.string().required(),
    accessToken: Joi.string().required(),
    refreshToken: Joi.date().required(),
    expiresIn: Joi.string().optional(),
  }).options({ abortEarly: false });

  return JoiSchema.validate(account);
}

function validatePost(post) {
  const JoiSchema = Joi.object({
    accounts: {
      twitter: Joi.array().required(), // change to optional when more platforms are added
    },
    text: Joi.string().optional(),
    attachment: Joi.string().optional(),
    datetime: Joi.date().required(),
    pollDuration: Joi.number().optional() || null,
    pollOptions: Joi.array().optional(),
    data: {
      twitter: {
        postId: Joi.string().optional(),
        status: Joi.string()
          .required()
          .valid("pending")
          .valid("posted")
          .valid("error"),
      },
    },
  })
    .options({ abortEarly: false })
    .xor("text", "attachment", "pollDuration", "pollOptions")
    .with("pollDuration", "pollOptions");

  return JoiSchema.validate(post);
}

function validateUser(user) {}

module.exports = { validateTwitterAccount, validatePost };
