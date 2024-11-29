const styles = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  color: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m',
    lime: '\x1b[92m',
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m',
    lime: '\x1b[102m',
  },
};

function styled(color, background) {
  let style = styles.color[color];

  if (background) {
    style += styles.bg[background];
  }

  return (message) => `${style}${message}${styles.reset}`;
}

class WatchdogService {
  constructor(isDebug) {
    this.isDebug = isDebug;

    this.log = console.log.bind(console);
    this.info = console.info.bind(console);
    this.warn = console.warn.bind(console);
    this.error = console.error.bind(console);
    this.debug = this.isDebug ? console.debug.bind(console) : () => {};
  }

  tag(tag, color, background) {
    const style = styled(color, background);

    return {
      log: (...args) => this.log(style(`[${tag}]`), ...args.map((arg) => style(arg))),
      info: (...args) => this.info(style(`[${tag}]`), ...args.map((arg) => style(arg))),
      warn: (...args) => this.warn(style(`[${tag}]`), ...args.map((arg) => style(arg))),
      error: (...args) => this.error(style(`[${tag}]`), ...args.map((arg) => style(arg))),
      debug: (...args) => this.debug(style(`[${tag}]`), ...args.map((arg) => style(arg))),
    };
  }
}

module.exports = WatchdogService;
