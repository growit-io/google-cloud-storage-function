const Logger = require('./logger.js').Logger
const optimiseImage = require('./image.js').optimise

let copy = function (f, options, cb) {
  let logger = new Logger(options.config)
  logger.log('copy', f.source, f.target)
  f.storage.copyFile(f.source, f.target, cb)
}

let optimise = function (f, options, cb) {
  let logger = new Logger(options.config)
  let func = copy
  if (f.isImage()) {
    func = optimiseImage
  }
  // TODO: handle additional optimisable file types, such as JSON files
  func(f, options, function (err) {
    if (err && func !== copy) {
      logger.log('optimise', err, '(falling back to copy)')
      return copy(f, options, cb)
    }
    cb(err)
  })
}

let deleteAll = function (f, options, cb) {
  exports.deleteCopy(f, options, function (err) {
    // TODO: also delete generated files if the copy of the original file no longer exists
    if (err) {
      return cb(err)
    }
    exports.deleteGenerated(f, options, cb)
  })
}

let deleteCopy = function (f, options, cb) {
  let logger = new Logger(options.config)
  logger.log('deleteCopy', f.target)
  deleteIfExists(f.storage, f.target, cb)
  // TODO: ignore 404 error when the file to be removed does not exist
}

let deleteGenerated = function (f, options, cb) {
  let logger = new Logger(options.config)
  logger.log('deleteGenerated', f.source)
  // TODO: delete all generated files related to f.source
  cb(null)
}

function deleteIfExists(storage, path, cb) {
  storage.exists(path, function (exists) {
    if (exists) {
      return storage.unlink(path, cb)
    }
    cb(null)
  })
}

exports.copy = copy
exports.optimise = optimise
exports.deleteAll = deleteAll
exports.deleteCopy = deleteCopy
exports.deleteGenerated = deleteGenerated
