const { MESSAGES_TYPES } = require('../constants');

const buildConnectRequest = () => ({
  type: MESSAGES_TYPES.CONNECTION_REQUEST,
  payload: null,
});


module.exports = {
  connectRequest: buildConnectRequest,
};
