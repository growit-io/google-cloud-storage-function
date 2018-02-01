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

/*
 * Construct an fs interface that operates relative to the given basedir. In
 * dev mode, this is used to manipulate the local filesystem instead of a real
 * Cloud Storage bucket.
 */
function fsInterface (basedir) {
  const dirname = path.dirname
  const abspath = function (relpath) {
    return path.join(basedir, relpath)
  }

  return {
    createReadStream: function (path) {
      return fs.createReadStream(abspath(path))
    },

    createWriteStream: function (path) {
      // Emulate the Cloud Storage Bucket behaviour where it creates missing
      // intermediate directories automatically.
      path = abspath(path)
      mkdirp(dirname(path), function (err) {
        if (err) {
          return cb(err)
        }
        return fs.createWriteStream(path)
      })
    },

    copyFile: function (src, dest, cb) {
      // Emulate the Cloud Storage Bucket behaviour where it creates missing
      // intermediate directories automatically.
      src = abspath(src)
      dest = abspath(dest)
      mkdirp(dirname(dest), function (err) {
        if (err) {
          return cb(err)
        }
        fs.copyFile(src, dest, cb)
      })
    },

    exists: function (path, cb) {
      // fs.exists is deprecated and fs.stat isn't quite what we want to emulate for Cloud Storage
      cb(fs.existsSync(abspath(path)))
    },

    // XXX: emulate cloud storage behaviour of removing empty directories?
    unlink: function (path, cb) {
      return fs.unlink(abspath(path), cb)
    }
  }
}

module.exports = function (config) {
  if (config.dev) {
    basedir = config.basedir || process.cwd()
    return fsInterface(basedir)
  } else {
    return storageInterface(config)
  }
}
