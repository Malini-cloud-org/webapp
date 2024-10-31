
// logging
import winston from 'winston';
import { format, transports } from 'winston';
import appRoot from 'app-root-path';

appRoot.setPath(appRoot.resolve('../'));

const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) =>
            JSON.stringify({
                timestamp: info.timestamp,
                severity: info.level.toUpperCase(),
                message: info.message,
            })
        )
    ),
    transports: [
        // Log all levels to the file
        new transports.File({
            filename: `${appRoot}/logs/csye6225webapp.log`,
            level: 'info', // Logs all messages from 'info' and above
        }),
        // Log only errors to the console
        new transports.Console({
            level: 'error', // Only logs errors to the console
        }),
    ],
});

export default logger;
