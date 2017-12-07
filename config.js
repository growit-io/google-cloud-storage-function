const deepmerge = require('deepmerge')
const fs = require('fs')

// TODO: compile the configuration at deployment time into an expanded version of config.json (akin to package-lock.json) to eliminate any dynamic aspect in generating the runtime configuration
// TODO: use minimatch to support glob patterns in addition to RegExp, below

// Load config.json from the current working directory
const config = fs.existsSync('config.json') ? JSON.parse(fs.readFileSync('config.json')) : {}

/*
 * Runtime configuration for this cloud function
 */
exports.config = deepmerge({
  /*
   * In local development mode we use the local filesystem in place of a Cloud
   * Storage bucket, and emit fake Cloud Storage events on file changes
   */
  dev: false,

  logger: {
    level: 'warn' // error < warn < info < debug
  },

  directories: {
    source: 'content',
    target: 'cache'
  },

  // FIXME: remove the storage.bucket option and infer the bucket from events
  storage: {
    bucket: null
  },

  /*
   * Kraken image optimiser API configuration
   */
  kraken: {
    api_key: null,
    api_secret: null
  },

  /*
   * Filetypes allow rules to match on the content type of a file, regardless
   * of its path.
   *
   * The filetype can currently only be determined by matching a regular
   * expression against the full path, which is slightly wrong.  We should
   * really use the file's MIME type, but for now this is good enough.
   */
  filetypes: {
    // Extend the regular expression to handle other image file types
    image: {
      match: /\.jpg$/
    },
    // Example of an additional file type which could be used in the rules
    json: {
      match: /\.json$/
    }
  },

  /*
   * Preconfigured actions which can be referenced in the rules. Each action
   * specifies a module, a function name and a hashmap of options to pass to
   * the function when invoked as part of a matching rule's action list.
   *
   * The module name defaults to 'file' and the function name defaults to the
   * action name.
   *
   * Rules can also reference other actions that aren't configured here, as
   * long as the name matches an exported function in the file.js module, or
   * the module name is included in the action name, such as "image.optimise".
   * Those actions will run with default options.
   */
  actions: {},

  /*
   * Rules determine what actions to take on each Cloud Storage event.  An
   * event fires for each object and metadata change in the bucket, i.e., for
   * each file that is uploaded, changed, deleted, or has its metadata changed
   * in any way. Be careful to avoid creating event loops in this ruleset.
   */
  rules: []
}, config)

// Enable local development mode if the source directory exists in the filesystem
if (fs.existsSync(exports.config.directories.source)) { // XXX not the best indicator
  exports.config.dev = true
}
