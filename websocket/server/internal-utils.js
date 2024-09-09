const { WS_CONNECTION_HEALTHCHECK_INTERVAL } = require('../../config');


const heartbeat = (ws) => ws.isAlive = true;

const initHealthCheckInterval = (server) => setInterval(() => {
  server.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, WS_CONNECTION_HEALTHCHECK_INTERVAL);

const validate = ({ schema, data }) => {
  const { value, error } = schema.validate(data);

  return { error, value };
};

const sendMessage = ({ connection, event, data }) => connection.send(JSON.stringify({ event, data }));
const sendError = ({ connection, errorType, message }) => sendMessage({ connection, event: 'error', data: { errorType, message } });


module.exports = {
  heartbeat,
  initHealthCheckInterval,
  validate,
  sendMessage,
  sendError,
};
