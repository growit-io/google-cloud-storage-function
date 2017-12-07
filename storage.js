const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const Storage = require('@google-cloud/storage')

var storage = Storage()

// TODO: add file metadata read/write functions, stored in ".meta" files in dev mode

// Emulates local file system calls on the Cloud Storage bucket
function storageInterface (config) {
  let bucket = config.storage.bucket
  return {
    // Returns a new ReadStream to read the file from the bucket
    createReadStream: function (path) {
      return storage.bucket(bucket).file(path).createReadStream()
    },
    // Returns a new WriteStream to write the file to the bucket
    createWriteStream: function (path) {
      return storage.bucket(bucket).file(path).createWriteStream()
    },
    // Copies the file to the other path in the same bucket
    copyFile: function (src, dest, cb) {
      storage.bucket(bucket).file(src)
        .copy(storage.bucket(bucket).file(dest), cb)
    },
    // Checks if the file exists in the bucket
    exists: function (path, cb) {
      storage.bucket(bucket).file(path).exists((err, exists) => {
        if (err) {
          // XXX: log this error as a warning, instead of ignoring it
          exists = false
        }
        cb(exists)
      })
    },
    // Deletes the file from the bucket
    unlink: function (path, cb) {
      storage.bucket(bucket).file(path).delete(cb)
    }
  }
}

// In dev mode, watch the local filesystem instead of the Cloud Storage bucket
function fsInterface () {
  return {
    createReadStream: fs.createReadStream,
    createWriteStream: function (dest) {
      let dir = path.dirname(dest)
      mkdirp.sync(dir)
      return fs.createWriteStream(dest)
    },
    copyFile: function (src, dest, cb) {
      let dir = path.dirname(dest)
      mkdirp(dir, function (err) {
        if (err) {
          return cb(err)
        }
        fs.copyFile(src, dest, cb)
      })
    },
    exists: function (path, cb) {
      // fs.exists is deprecated and fs.stat isn't quite what we want to emulate for Cloud Storage
      cb(fs.existsSync(path))
    },
    // XXX: emulate cloud storage behaviour of removing empty directories?
    unlink: fs.unlink
  }
}

module.exports = function (config) {
  if (config.dev) {
    return fsInterface()
  } else {
    return storageInterface(config)
  }
}
