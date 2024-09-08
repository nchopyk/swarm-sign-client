const { MESSAGES_TYPES } = require('../constants');

const buildConnectRequest = () => ({
  type: MESSAGES_TYPES.CONNECTION_REQUEST,
  payload: null,
});

const buildAcknowledgeConnectRequest = ({ masterId }) => ({
  type: MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST,
  payload: { masterId },
});


module.exports = {
  connectRequest: buildConnectRequest,
  acknowledgeConnectRequest: buildAcknowledgeConnectRequest,
};
