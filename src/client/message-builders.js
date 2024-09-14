const buildErrorMessages = ({ errorType, message }) => {
  return { errorType, message };
};

const buildNewScreenEvent = () => {
  return { width: 0, height: 0 };
};


module.exports = {
  buildErrorMessages,
  buildNewScreenEvent,
};
