function log(level, event, data = {}) {
  console.log(JSON.stringify({
    level,
    event,
    service: 'trainshop-api',
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

module.exports = {
  info:  (event, data) => log('info',  event, data),
  warn:  (event, data) => log('warn',  event, data),
  error: (event, data) => log('error', event, data),
};
