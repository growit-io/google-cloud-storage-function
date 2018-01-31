const fs = require('fs')
const fixtures = require('jest-fixtures')
const tempDirPath = fixtures.createTempDirSync()
const examplesDirPath = fixtures.getFixturePathSync(__dirname, 'examples', 'content')

// This should match the Basic Usage example in README.md.
const monitor = require('./index')({
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
  dev: true
})


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
    it('creates cache/test.jpg', async () => {
      // Test setup
      await fixtures.copyDir('examples/content', tempDirPath + '/content')

      // TODO: test: avoid process.chdir because it interferes with jest-resolve
      process.chdir(tempDirPath)

      // Preconditions and total number of assertions to expect
      expect.assertions(3)
      expect(fs.existsSync('content/test.jpg')).toBe(true)
      expect(fs.existsSync('cache/test.jpg')).toBe(false)

      // The function's return value is not defined; it's only important
      // that the Promise resolves.
      return monitor(gcsAddEvent).then(() => {
        expect(fs.existsSync('cache/test.jpg')).toBe(true)
      })
    })
  })

  describe('upload and removal of content/test.jpg', () => {
    it.skip('creates and removes cache/test.jpg', async () => {
      // Test setup
      await fixtures.copyDir('examples/content', tempDirPath + '/content')
      process.chdir(tempDirPath)

      // Preconditions and total number of assertions to expect
      expect.assertions(3)
      expect(fs.existsSync('content/test.jpg')).toBe(true)
      expect(fs.existsSync('cache/test.jpg')).toBe(false)

      // The rules and events are chosen so that a single copy of the source
      // file is created and then removed again in the target directory.
      monitor(gcsAddEvent).then(() => {
        expect(fs.existsSync('cache/test.jpg')).toBe(true)
        return monitor(gcsDeleteEvent).then(() => {
          expect(fs.existsSync('cache/test.jpg')).toBe(false)
        })
      })
    })
  })
})
