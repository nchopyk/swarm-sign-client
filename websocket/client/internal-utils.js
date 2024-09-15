const validate = ({ schema, data }) => {
  const { value, error } = schema.validate(data);

  return { error, value };
};

const sendMessage = ({ connection, clientId, event, data }) => connection.send(JSON.stringify({ clientId, event, data }));


module.exports = {
  validate,
  sendMessage,
};
