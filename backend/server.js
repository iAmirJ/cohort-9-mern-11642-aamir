require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const logger = require('./src/utils/logger');
const { initSocket } = require('./src/sockets/socket');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});