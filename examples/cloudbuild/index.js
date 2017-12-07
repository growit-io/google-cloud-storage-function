/**
 * Background Cloud Function triggered by Cloud Storage events.
 *
 * @param {object} event The Cloud Storage event.
 */
exports.monitor = require('@growit-io/google-cloud-storage-function')({
 directories: {
   source: 'content',
   target: 'cache'
 },
 rules: [{
   events: ['add','update'],
   actions: ['copy']
 },{
   events: ['delete'],
   actions: ['delete']
 }]
})
