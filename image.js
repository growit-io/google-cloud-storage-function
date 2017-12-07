const sharp = require('sharp')

const kraken = require('./kraken.js').optimise
const Logger = require('./logger.js').Logger

exports.optimise = function (f, options, cb) {
  // TODO: re-implement optimise as an application of the generate function, once support for the "optimise" variant property has been added
  kraken(f, options, cb)
}

exports.generate = function (f, options, cb) {
  let logger = new Logger(options.config)
  var variants = []
  for (var x in options.variants) {
    var v = options.variants[x]
    let src = options.source(f, v)
    let dst = options.target(f, v)
    let xfm = sharp()
    let msg = ''
    // TODO: use the "optimise" property to control whether the image should be optimised at all?
    // TODO: use the "optimise" property to control whether to use sharp or Kraken for resizing?
    if (v.width || v.height) {
      xfm = xfm.resize(v.width, v.height)
      msg += ' ' + v.width + 'x' + v.height
    }
    // TODO: add support for other transformations as needed, or make the transformations entirely configurable
    logger.log('generate', src, dst + msg)
    variants.push(generateVariant(f, src, dst, xfm))
  }
  // Generate all variants in parallel
  Promise.all(variants).then(() => { cb(null) }).catch(cb)
}

function generateVariant (f, src, dst, xfm) {
  return new Promise(function (resolve, reject) {
    f.createReadStream(src)
      .on('error', (err) => { reject(err) })
      .on('end', () => { resolve() })
      .pipe(xfm)
      .pipe(f.createWriteStream(dst))
  })
}
