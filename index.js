const Monitor = require('./monitor.js').Monitor

/*
 * The module function returns a new Background Function to handle Cloud
 * Storage events, which can then be called directly as a Cloud Function.
 */
module.exports = function (config) {
  // Declared outside to avoid loading config.json on each function call
  let m = new Monitor(config)

  /**
   * Background Cloud Function to be triggered by Cloud Storage.
   * @param {object} event The Cloud Storage event.
   */
  return function (event) {
    return m.handleEvent(event)
  }
}
