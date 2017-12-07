// XXX: Filetypes should really be based on the MIME type from the file object's metadata

// XXX: detect should take a FileObject as argument, not a path, in order to gain access to the file's metadata
exports.detect = function (config, path) {
  let result = []
  for (var name in config.filetypes) {
    var ft = config.filetypes[name]
    if (!ft.match) {
      throw new Error('Missing "match" property of filetype "' + name + '"')
    }
    var re = new RegExp(ft.match)
    if (re.exec(path)) {
      result.push(name)
    }
  }
  return result
}
