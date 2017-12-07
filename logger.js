//const LOG_ERROR = 0
//const LOG_WARN = 1
//const LOG_INFO = 2
const LOG_DEBUG = 3
const LOG_LEVELS = ['error', 'warn', 'info', 'debug']

let Logger = function (config) {
  this.config = config
}

Logger.prototype.getLevel = function () {
  return this.config.logger.level || 'debug'
}

Logger.prototype.log = function (...args) {
  console.log(...args)
}

Logger.prototype.debug = function (...args) {
  let l = LOG_LEVELS.indexOf(this.getLevel())
  if (l >= LOG_DEBUG) {
    console.log(...args)
  }
}

exports.Logger = Logger
