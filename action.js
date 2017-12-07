const Logger = require('./logger.js').Logger

const FILE_MODULE = 'file'

// Coerces its arguments, which must be either instances of String or Action, into an array of Action objects
let Actions = function (config, actions) {
  let result = []
  for (var x in actions) {
    let action = actions[x]
    if (!(action instanceof Action)) {
      // Create a new Action with options from config.actions
      let name = actions[x]
      let options = config.actions[name]
      action = new Action(name, options, config)
    }
    result.push(action)
  }
  return result
}

let Action = function (name, options, config) {
  options = options || {}
  // TODO: handle qualified action names that include the module name, such as "image.optimise"
  this.name = name
  this.module = options.module || FILE_MODULE
  this.functionName = options.function || name
  let module = requireModule(this.module)
  if (!(module[this.functionName] instanceof Function)) {
    throw new Error('The module "' + this.module + '" does not export a function named "' + this.functionName + '"')
  }
  this.function = module[this.functionName]
  // Pass the runtime configuration to the action function in options.config
  this.options = {}
  Object.assign(this.options, options.options || {})
  Object.assign(this.options, {config: config})
  this.logger = new Logger(config)
}

Action.prototype.run = function (f) {
  var logger = this.logger
  var func = this.function
  var options = this.options
  // Wrap calls to the action callback function in a Promise, so that we can easily wait for the action callback to complete before running subsequent actions
  var self = this
  return new Promise(function (resolve, reject) {
    logger.debug('rule[' + f.rule + ']:', 'action', self.module + '.' + self.functionName, 'as "' + self.name + '" with options', JSON.stringify(options))
    func(f, options, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function requireModule(name) {
  // TODO: move modules that provide actions to the ./actions subdirectory (file.js, kraken.js, and image.js)
  return require('./' + name + '.js')
}

exports.Action = Action
exports.Actions = Actions
