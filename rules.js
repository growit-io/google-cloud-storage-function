const Logger = require('./logger.js').Logger
const filetype = require('./filetype.js')
const Actions = require('./action.js').Actions

/*
 * Derive an array of Rule objects from the given configuration
 */
let Rules = function (config) {
  let rules = []
  for (var x in config.rules) {
    let r = new Rule(x, config.rules[x], config)
    rules.push(r)
  }
  return rules
}

let Rule = function (id, rule, config) {
  this.id = id
  this.regexp = new RegExp(rule.match || rule.regexp || '.+') // matches any non-empty path
  this.filetypes = rule.filetypes || []
  this.events = rule.events
  this.actions = Actions(config, rule.actions)
  // TODO: rename this.continue to this.fallthrough, consistent with classic /* fallthrough */ comments in C code on switch statements
  this.continue = rule.continue // Evaulate the remaining rules if true
  this.config = config
  this.logger = new Logger(config)
}

Rule.prototype.match = function (event, f) {
  let logger = this.logger
  let path = f.path
  let desc = ''
  // Detect the file type based on file extension and whatnot
  if (!this.events.includes(event)) {
    logger.debug('rule[' + this.id + ']: rejected "' + event + '" event because it is not included in ' + JSON.stringify(this.events))
    return false
  }
  // Match the path against the rule's regular expression
  let match
  if (!(match = this.regexp.exec(path))) {
    logger.debug('rule[' + this.id + ']: rejected "' + path + '" because it does not match ' + this.regexp)
    return false
  } else {
    desc += ' matching ' + this.regexp
  }
  // Match the detected filetypes against the rule's filetypes
  let filetypes = filetype.detect(this.config, path)
  if (this.filetypes.length > 0) {
    let ft
    for (var x in filetypes) {
      if (this.filetypes.includes(filetypes[x])) {
        ft = filetypes[x]
        break
      }
    }
    if (!ft) {
      logger.debug('rule[' + this.id + ']: rejected "' + path + '" because its type is not included in ' + JSON.stringify(this.filetypes))
      return false
    } else {
      desc += ' with file type "' + ft +'"'
    }
  }
  // We have a matching rule
  logger.debug('rule[' + this.id + ']: matched "' + event + '" event for "' + path + '"' + desc)
  return new Match(this, event, f, filetypes, match)
}

let Match = function (rule, event, file, filetypes, match) {
  Rule.call(this, rule.id, rule, rule.config)
  this.rule = rule.id
  this.event = event
  this.file = file
  this.path = file.path
  this.name = file.path // XXX: deprecated; use this.path, instead
  this.source = rule.config.directories.source + '/' + this.path
  this.target = rule.config.directories.target + '/' + this.path
  this.storage = file.storage
  this.filetypes = filetypes // overwrites Rule's this.filetypes
  this.match = match // the RegExp match, an array of subexpression matches
}

Match.prototype = Object.create(Rule.prototype)
Match.prototype.constructor = Match

Match.prototype.createReadStream = function (path) {
  if (arguments.length < 1) {
    path = this.source
  }
  return this.file.createReadStream(path)
}

Match.prototype.createWriteStream = function (path) {
  if (arguments.length < 1) {
    path = this.target
  }
  return this.file.createWriteStream(path)
}

Match.prototype.run = function () {
  let p = Promise.resolve()
  for (var x in this.actions) {
    let action = this.actions[x]
    let self = this
    p = p.then(function () { return action.run(self) })
  }
  return p
}

Match.prototype.isImage = function () {
  return this.isFileType('image')
}

Match.prototype.isFileType = function (name) {
  for (var x in this.filetypes) {
    let ft = this.filetypes[x]
    if (ft === name) {
      return true
    }
  }
  return false
}

exports.Rule = Rule
exports.Rules = Rules
