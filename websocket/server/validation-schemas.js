const Joi = require('joi');


const validationSchemas = {
  incomingMessage: Joi.object().keys({
    clientId: Joi.string().uuid().required(),
    event: Joi.string().max(255).required(),
    data: Joi.object().allow(null).required(),
  }),
};


module.exports = validationSchemas;
