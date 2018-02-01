const config = require('./config')

test('config exports a config object', () => {
  const expected = {
    config: {
      logger: {},
      directories: {},
      storage: {},
      kraken: {},
      filetypes: {},
      actions: {},
      rules: expect.arrayContaining([])
    }
  }

  expect(config).toMatchObject(expected)
})
