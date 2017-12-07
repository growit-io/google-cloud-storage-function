const path = require('path')
const Cache = require('streaming-cache')

// TODO: add support for reading and writing file metadata (can easily be attached to any path in Cache, already)
// TODO: track generated files and add metadata to them in order to link them to the source file
// TODO: save this cloud function's last execution ID and status in the source file's metadata

// FileObject represents a file object in the Cloud Storage bucket
function FileObject (storage, config, relpath) {
  this.path = relpath
  this.storage = storage
  this.source = path.join(config.directories.source, relpath)
  this.target = path.join(config.directories.target, relpath)
  this.cache = new Cache()
}

/*
 * createReadStream streams the file from Cloud Storage into memory and
 * returns a readable stream which reads from memory as data becomes available.
 * Subsequently reading the same file serves all data content from memory.
 */
FileObject.prototype.createReadStream = function (path) {
  // Get the cached stream for this path
  let cached = this.cache.get(path)
  if (cached) {
    // Reading from storage may still be in progress, but that's fine
    return cached
  }
  return this.storage.createReadStream(path).pipe(this.cache.set(path))
}

/*
 * createWriteStream returns a writable stream to memory buffers. Once the
 * writable stream is closed, the data is flushed to storage in the background.
 * Subsequently reading from the same path will retrieve the previously written
 * data from memory.
 */
FileObject.prototype.createWriteStream = function (path) {
  let writable = this.cache.set(path)
  writable.pipe(this.storage.createWriteStream(path))
  return writable
}

exports.FileObject = FileObject
