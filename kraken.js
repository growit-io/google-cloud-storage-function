const Kraken = require('kraken')
const request = require('request')
const streamBuffers = require('stream-buffers')

const Logger = require('./logger.js').Logger

const BUFFER_INITIAL_SIZE = 1024 * 1024 // start at 1 megabyte
const BUFFER_INCREMENT_AMOUNT = 1024 * 1024 // grow by 1 megabyte each time the buffer overflows

function optimise(f, options, cb) {
  let logger = new Logger(options.config)
  logger.log('optimise', f.source)

  /*
   * Slurp the whole file into one large Buffer, because we can't upload
   * directly from a Cache stream, or from a Cloud Storage stream.  In both
   * scenarios the Kraken API returns the error message "502 Bad Gateway",
   * which indicates that the request is severely malformed. :(
   */
  // FIXME: fix streaming uploads from Cache, likely in request or form-data
  buffer(f.createReadStream(), function (err, buf) {
    if (err) {
      return cb(err)
    }
    // Start the upload to Kraken
    logger.debug('kraken', f.source, 'upload start')
    upload(buf, options, function (err, data) {
      if (err) {
        // Upload to Kraken failed, or the API failed on the server-side
        return cb(err)
      }
      // Upload succeeded
      logger.debug('kraken', f.source, 'upload result', data)
      // Open the output file for writing and start the download
      let dst = f.createWriteStream()
      let saved = data.original_size - data.kraked_size
      // TODO: report statistics as "saved XX% (Y bytes)" to be more clear
      logger.log('kraken', f.target, 'saved ' + saved + ' bytes')
      download(logger, data.kraked_url, dst, cb)
    })
  })
}

function upload(src, options, cb) {
  var config = options.config
  var kraken = new Kraken({
    api_key: config.kraken.api_key,
    api_secret: config.kraken.api_secret
  })

  var opts = {
    auth: {
      api_key: kraken.auth.api_key,
      api_secret: kraken.auth.api_secret
    },
    // Default to lossy:false if no kraken options are present
    lossy: (options.kraken && options.kraken.lossy) ? true : false,
    wait: true
  }

  request.post({
    url: 'https://api.kraken.io/v1/upload',
    json: true,
    strictSSL: false,
    formData: {
      data: JSON.stringify(opts),
      file: {
        value: src, // a Buffer, or *compatible* stream implementation (see above)
        options: {
          filename: 'image.jpg', // doesn't really matter, as long as it's there
          contentType: 'image/jpeg' // neither does this, not for most image types anyway
        }
      }
    }
  }, function (err, httpResponse, data) {
    if (err || !data.success) {
      err = err || new Error('Unsuccessful response from Kraken upload API: ' + data.message)
      return cb(err)
    }
    cb(null, data)
  })
}

// Downloads the optimised image contents to the writable dst stream
function download(logger, url, dst, cb) {
  // Start the download
  logger.debug('kraken', 'download', url, 'start')
  request.get(url)
    .on('error', function (err) {
      // Failed to start the download or write to file
      logger.debug('kraken', 'download', url, 'read error')
      cb(err)
    })
    .on('end', function () {
      // Download and write completed successfully
      logger.debug('kraken', 'download', url, 'read done')
      cb(null)
    })
    .pipe(dst)
    .on('error', function (err) {
      // Failed to start the download or write to file
      logger.debug('kraken', 'download', url, 'write error')
      cb(err)
    })
    .on('data', () => {}) // start reading, but discard the data
    .on('end', function () {
      // Download and write completed successfully
      logger.debug('kraken', 'download', url, 'write done, end')
      cb(null)
    })
}

// Reads the whole src stream into a Buffer, before invoking the callback
function buffer(src, cb) {
  let buf = new streamBuffers.WritableStreamBuffer({
    initialSize: BUFFER_INITIAL_SIZE,
    incrementAmount: BUFFER_INCREMENT_AMOUNT
  })
  src.on('error', cb)
  src.on('end', () => { cb(null, buf.getContents()) })
  src.pipe(buf)
}

exports.optimise = optimise
