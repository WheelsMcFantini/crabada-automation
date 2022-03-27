const { format, createLogger, transports } = require('winston')
const { combine, splat, timestamp, printf } = format;

const myFormat = printf( ({ level, message, timestamp , ...metadata}) => {
  let msg = `${timestamp} [${level}] : ${message} `  
  if(metadata) {
	msg += JSON.stringify(metadata)
  }
  return msg
});


const parentLogger = createLogger({
    level: 'info',
    format: combine(
        format.uncolorize(),
        splat(),
        timestamp(),
        myFormat
  ),
  transports: [
    new transports.Console({ level: 'debug' }),
    //new transports.File({ filename: 'combined.log' })
  ]
});

module.exports = parentLogger 