require('dotenv').config();

const app = require('./app');
const logger = require('./logger');
const { version } = require('../package.json');

const port = Number(process.env.API_PORT || 3000);

app.listen(port, '0.0.0.0', () => {
  logger.info('startup', {
    version: process.env.APP_VERSION || version,
    port,
    environment: process.env.NODE_ENV || 'development',
  });
});
