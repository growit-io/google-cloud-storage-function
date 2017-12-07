/**
 * Background Cloud Function triggered by Cloud Storage events
 * @param {object} event The Cloud Storage event
 * @return {Promise}
 */
exports.kraken = require('@growit-io/google-cloud-storage-function')()
