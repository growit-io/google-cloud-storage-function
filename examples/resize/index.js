const path = require('path')

/**
 * Background Cloud Function triggered by Cloud Storage events
 * @param {object} event The Cloud Storage event
 * @return {Promise}
 */
exports.resize = require('@growit-io/google-cloud-storage-function')({
  actions: {
    /*
     * generate (in image.js) generates image variants for any image file in
     * the source directory.  The generate function is easy to extend, so that
     * with a few lines added to image.js, an image variant could specify
     * arbitrary transformations.
     */
    generate: {
      module: 'image',
      options: {
        // Target path for each of the configured variants
        target: function (f, v) {
          let dir = path.dirname(path.dirname(f.name))
          let name = path.basename(f.name)
          return path.join(exports.config.directories.target, dir, v.slug, name)
        }
      }
    }
  },
  rules: [{
    filetypes: ['image'],
    events: ['add','update'],
    actions: ['generate']
  },{
    events: ['delete'],
    actions: ['deleteGenerated']
  }]
})
