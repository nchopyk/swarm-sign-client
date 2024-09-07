const { MESSAGES_TYPES } = require('../constants');

const buildConnectRequestResponse = ({ masterId }) => ({
  type: MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE,
  payload: { masterId }
});


module.exports = {
  connectRequestResponse: buildConnectRequestResponse,
};
