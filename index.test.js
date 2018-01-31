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
  }]
})

describe('Basic Usage example from README.md', () => {
  const gcsAddEvent = {
    data: {
      name: 'content/test.jpg',
      metadatageneration: '1'
    }
  }

  describe('upload of content/test.jpg', () => {
    it('creates cache/test.jpg', () => {
      expect.assertions(1)
      expect(monitor(gcsAddEvent)).resolves.toEqual({})
    })
  })
})
