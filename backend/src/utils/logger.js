const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, 'app.log');

const logLevels = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  debug: 'DEBUG'
};

const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${logLevels[level]}] ${message}`;
  
  if (data) {
    return `${logMessage} ${JSON.stringify(data)}`;
  }
  
  return logMessage;
};

const logger = {
  error: (message, data) => {
    const log = formatLog('error', message, data);
    console.error(log);
    fs.appendFileSync(LOG_FILE, log + '\n');
  },
  
  warn: (message, data) => {
    const log = formatLog('warn', message, data);
    console.warn(log);
    fs.appendFileSync(LOG_FILE, log + '\n');
  },
  
  info: (message, data) => {
    const log = formatLog('info', message, data);
    if (process.env.LOG_LEVEL !== 'error') {
      console.log(log);
    }
    fs.appendFileSync(LOG_FILE, log + '\n');
  },
  
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog('debug', message, data);
      console.log(log);
      fs.appendFileSync(LOG_FILE, log + '\n');
    }
  }
};

module.exports = logger;
