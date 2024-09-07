const { MESSAGES_TYPES } = require('../constants');

const buildConnectRequestResponse = ({ masterId }) => ({
  type: MESSAGES_TYPES.CONNECT_REQUEST_RESPONSE,
  payload: {
    masterId,
  }
});


module.exports = {
  connectRequestResponse: buildConnectRequestResponse,
};
