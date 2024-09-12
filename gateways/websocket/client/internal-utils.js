
const validate = ({ schema, data }) => {
  const { value, error } = schema.validate(data);

  return { error, value };
};

const sendMessage = ({ connection, event, data }) => connection.send(JSON.stringify({ event, data }));
const sendError = ({ connection, errorType, message }) => sendMessage({ connection, event: 'error', data: { errorType, message } });


module.exports = {
  validate,
  sendMessage,
  sendError,
};
