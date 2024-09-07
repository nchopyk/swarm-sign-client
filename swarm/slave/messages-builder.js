const { MESSAGES_TYPES } = require('../constants');

const buildConnectRequest = () => ({
  type: MESSAGES_TYPES.CONNECT_REQUEST,
  payload: null,
});


module.exports = {
  connectRequest: buildConnectRequest,
};
