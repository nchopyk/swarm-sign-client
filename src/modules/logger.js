const info = (message, { tag } = {}) => {
  const tagText = tag ? `[${tag}] ` : '';

  console.log(`\x1b[34m${tagText}${message}\x1b[0m`);
};


const warn = (message, { tag } = {}) => {
  const tagText = tag ? `[${tag}] ` : '';

  console.log(`\x1b[33m${tagText}${message}\x1b[0m`);
};

const error = (message, { tag } = {}) => {
  const tagText = tag ? `[${tag}] ` : '';

  console.log(`\x1b[31m${tagText}${message}\x1b[0m`);
};

module.exports = {
  info,
  warn,
  error,
};
