import { createLogger, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `${timestamp}\t${level}\t${stack}}`;
      }
      return `${timestamp}\t${level}\t${JSON.stringify(message)}`;
    })
  ),
  transports: [
    new DailyRotateFile({
      filename: 'log/%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export default logger;
