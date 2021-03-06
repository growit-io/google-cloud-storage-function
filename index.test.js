const fs = require('fs')
const path = require('path')
const fixtures = require('jest-fixtures')

function createMonitor(tempDirPath) {
  // This configuration should match the Basic Usage example in README.md.
  return require('./index')({
    loadConfigFromBucket: false,
    loadConfigFromSource: false,
    directories: {
      source: 'content',
      target: 'cache'
    },
    rules: [{
      events: ['add','update'],
      actions: ['copy']
    },{
      events: ['delete'],
      actions: ['deleteAll']
    }],
    // This should be the only deviation from the example, which enables
    // quick local testing without a bucket. Some tests should also be run
    // against a real bucket, but local testing is all there is for now.
    dev: true,
    basedir: tempDirPath
  })
}

describe('Basic Usage example from README.md', () => {
  const gcsAddEvent = {
    data: {
      name: 'content/test.jpg',
      metadatageneration: '1'
    }
  }

  const gcsDeleteEvent = {
    data: {
      name: 'content/test.jpg',
      resourceState: 'not_exists'
    }
  }

  describe('upload of content/test.jpg', () => {
    it('creates cache/test.jpg', () => {
      // Total number of expected assertions in this test
      expect.assertions(3)
      // Test setup
      const tempDirPath = fixtures.createTempDirSync()
      const monitor = createMonitor(tempDirPath)
      const setup = fixtures.copyDir('examples/content', path.join(tempDirPath, 'content'))
      return setup.then(() => {
        // Preconditions
        expect(fs.existsSync(path.join(tempDirPath, 'content/test.jpg'))).toBe(true)
        expect(fs.existsSync(path.join(tempDirPath, 'cache/test.jpg'))).toBe(false)
        // The function's return value is not defined; it's only important that
        // the Promise resolves.
        return monitor(gcsAddEvent).then(() => {
          expect(fs.existsSync(path.join(tempDirPath, 'cache/test.jpg'))).toBe(true)
        })
      })
    })
  })

  describe('upload and removal of content/test.jpg', () => {
    it('creates and removes cache/test.jpg', () => {
      // Total number of assertions expected in this test
      expect.assertions(4)
      // Test setup
      const tempDirPath = fixtures.createTempDirSync()
      const monitor = createMonitor(tempDirPath)
      const setup = fixtures.copyDir('examples/content', path.join(tempDirPath, 'content'))
      return setup.then(() => {
        // Preconditions
        expect(fs.existsSync(path.join(tempDirPath, 'content/test.jpg'))).toBe(true)
        expect(fs.existsSync(path.join(tempDirPath, 'cache/test.jpg'))).toBe(false)
        // The rules and events are chosen so that a single copy of the source
        // file is created and then removed again in the target directory.
        return monitor(gcsAddEvent).then(() => {
          expect(fs.existsSync(path.join(tempDirPath, 'cache/test.jpg'))).toBe(true)
          return monitor(gcsDeleteEvent).then(() => {
            expect(fs.existsSync(path.join(tempDirPath, 'cache/test.jpg'))).toBe(false)
          })
        })
      })
    })
  })
})
