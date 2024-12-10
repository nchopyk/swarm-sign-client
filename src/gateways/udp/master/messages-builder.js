const { MESSAGES_TYPES } = require('../constants');
const state = require('../../../state');

const buildConnectRequestResponse = ({ masterId }) => ({
  type: MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE,
  payload: { masterId, rating: state.ratingData?.rating || null },
});

const buildAcknowledgeConnectRequestResponse = ({ masterId, websocketPort }) => ({
  type: MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST_RESPONSE,
  payload: { masterId, websocketPort },
});


module.exports = {
  connectRequestResponse: buildConnectRequestResponse,
  acknowledgeConnectRequestResponse: buildAcknowledgeConnectRequestResponse,
};
