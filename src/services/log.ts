const log = (...args: unknown[]) => {
  const now = new Date();
  const time = [
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
  ].join(':');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  console.log(`[${time}.${ms}]`, ...args);
};

export default log;
