const config = {
  directories: {
    source: 'content',
    target: 'cache'
  }
}

const handleEvent = require('@growit-io/google-cloud-storage-function')(config)
const src = config.directories.source

console.log('watch', src)

const chokidar = require('chokidar')
const options = {
  ignoreInitial: true
}

chokidar.watch(src, options).on('all', (fsEvent, path) => {
  // Emulate directory events by appending a '/' to the path
  if (fsEvent.endsWith('Dir')) {
    path += '/'
  }

  let ev // canonical event name for debugging
  let gcsEvent = {data: {name: path}} // fake Cloud Storage event

  if (fsEvent.startsWith('add')) {
    // object is a new file or directory
    gcsEvent.data.metageneration = '1'
    ev = 'add'
  } else if (fsEvent.startsWith('unlink')) {
    // object was removed
    gcsEvent.data.resourceState = 'not_exists'
    ev = 'delete'
  } else if (fsEvent === 'change') {
    // object was changed
    gcsEvent.data.metageneration = '2'
    ev = 'update'
  } else {
    console.debug('ignore', path, ev, 'event is not applicable')
    return
  }

  // Fake a Cloud Function call
  console.log('start', path, ev)
  Promise.resolve(handleEvent(gcsEvent))
    .then(() => {
      /*
       * No more functions should be running after this message. If you still
       * see output from this event after this message, then you have created
       * an unmonitored, asynchronous function call somewhere, or failed to
       * return a Promise. If on the other hand you don't see this message at
       * all, then you have probably forgotten to invoke a callback function
       * somewhere.
       */
      console.log('end', path, ev)
    })
})
