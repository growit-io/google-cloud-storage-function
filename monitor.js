const deepmerge = require('deepmerge')

const config = require('./config.js').config
const Logger = require('./logger.js').Logger
const Rules = require('./rules.js').Rules
const FileObject = require('./fileobject.js').FileObject

/*
 * Monitor constructs a new Cloud Storage event handler
 */
let Monitor = function (options) {
  this.config = deepmerge(config, options || {})
}

/*
 * handleEvent should be called with an object change event from Cloud Storage.
 * This method returns a Promise.
 */
Monitor.prototype.handleEvent = function (event) {
  const logger = new Logger(this.config)
  const src = this.config.directories.source
  const ev = eventType(event)

  // Get the full path of the file that has changed
  let path = event.data.name
  if (!path.startsWith(src + '/')) {
    logger.debug('ignore', path, ev, 'outside of the "' + src + '" directory')
    return null
  }

  // TODO: recognise and evaluate rules for directory events as well
  if (path.endsWith('/')) {
    logger.debug('ignore', path, ev, 'directory')
    return null
  }

  // Default the bucket name to the first one reported by any event
  if (!this.config.storage.bucket) {
    this.config.storage.bucket = event.data.bucket
  }

  // Create the storage interface
  if (!this.storage) {
    this.storage = require('./storage.js')(this.config)
  }

  /*
   * The path is stored internally as relative to both the source and target
   * directories. The Match object has properties like f.source and f.target
   * to get the full path back.
   */
  path = path.slice(src.length + 1)
  logger.debug('trigger', path, ev)

  /*
   * Create a new FileObject that is shared across all actions, but note that
   * the `f` argument that is passed to action callback functions is a Match
   * object from rules.js, which has an internal reference to this FileObject.
   */
  var f = new FileObject(this.storage, this.config, path)

  /*
   * Evaluate each rule against the FileObject and current event.
   *
   * Note that a Promise is returned here, and used in a few other places where
   * the callback convention got in the way, like when multiple tasks need to
   * complete before executing the next step. Predominantly, this code is using
   * the calback convention, though.
   */
  let p = Promise.resolve()
  let rules = Rules(this.config)
  for (var x in rules) {
    let rule = rules[x]
    let match = rule.match(ev, f)
    if (match) {
      p = p.then(function () { return match.run() })
      // By default, ruleset evaluation stops on the first match
      if (!rule.continue) {
        break
      }
    }
  }

  // Run the matching rules in sequence before finishing this Cloud Function
  return p
  // TODO: catch all otherwise unhandled errors here, and finally update the source file's metadata
  // TODO: retry failed operations by re-posting the event to our Pub/Sub topic
  // TODO: handle terminal error conditions by notifying site operations
}

// Strange way to find the canonical event name, but straight from the tutorial
function eventType(event) {
  // TODO: update this logic for Pub/Sub triggers, if necessary
  const file = event.data
  if (file.resourceState === 'not_exists') {
    return 'delete'
  } else if (file.metageneration === '1') {
    // The metageneration attribute is updated on metadata changes. On create, the value is 1.
    return 'add'
  } else {
    return 'update'
  }
}

exports.Monitor = Monitor
