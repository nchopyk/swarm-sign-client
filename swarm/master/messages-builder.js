const { MESSAGES_TYPES } = require('../constants');

const buildConnectRequestResponse = ({ masterId }) => ({
  type: MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE,
  payload: { masterId }
});

const buildAcknowledgeConnectRequestResponse = ({ masterId, websocketPort }) => ({
  type: MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST_RESPONSE,
  payload: { masterId, websocketPort },
});


module.exports = {
  connectRequestResponse: buildConnectRequestResponse,
  acknowledgeConnectRequestResponse: buildAcknowledgeConnectRequestResponse,
};
