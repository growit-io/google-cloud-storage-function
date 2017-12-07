# Google Cloud Storage Function
[Background Function](https://cloud.google.com/functions/docs/writing/background) that handles object change events from a Cloud Storage bucket, and runs predefined actions for events matching a configurable set of rules.

## Prerequisites
- Access to an existing Google Cloud project.
- A Cloud Storage bucket to monitor in your project.
- An idea of some actions you want to perform when events are emitted by the bucket.

## Initial Setup
Check out the [examples](examples/README.md) and copy one of them as a starting point for your own Cloud Function. Each example comes with complete setup instructions.

## Basic Usage
```javascript
/**
 * Background Cloud Function triggered by Cloud Storage events
 * @param {object} event The Cloud Storage event
 * @return {Promise}
 */
exports.monitor = require('@growit-io/google-cloud-storage-function')({
  // See Configuration, below
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
    actions: ['delete']
  }]
})
```

## Configuration
The default configuration is in [config.js](config.js). This default configuration will be merged at runtime with your own deployment configuration in `config.json`, the configuration supplied to the constructor of this Background Function, and with `/config.json` from the bucket, if it exists and **loadConfigFromBucket** is `true`.

### Function
The top-level configuration options below affect the Background Function's mode of operation, and how it generates its runtime configuration.

| option | default | description |
| :----- | :------ | :---------- |
| **dev** | `true` if **directories.source** exists in local filesystem; `false`, otherwise | Whether to enable local development mode. In local development node, all Cloud Storage operations are mapped to the local filesystem. |
| **loadConfigFromBucket** | `true` | Whether load `/config.json` from the Cloud Storage bucket, if it exists. |
| **loadConfigFromSource** | `true` | Whether load `config.json` from the Cloud Function source directory, if it exists. |

### Logging
The verbosity of the Background Function logs can be controlled with the **logger.level** option. Leave this at a reasonable low setting to avoid log spam if your bucket receives a lot of changes.

| option | default | description |
| :----- | :------ | :---------- |
| **logger.level** | `"warn"` | Log level for the modules in the Background Function (`"error"` &lt; `"warn"` &lt; `"info"` &lt; `"debug"`) |

### Directories
The Background Function will only evaluate rules for objects within **directories.source**, and modify objects only in **directories.target**. This restriction has a dual-purpose: to avoid event loops, and to encourage a distinction between original content and generated content in your bucket. If this is too restrictive for your scenario, set both options to `""` to evaluate rules on all events, and to let actions modify objects anywhere in the bucket.

| option | default | description |
| :----- | :------ | :---------- |
| **directories.source** | `content` | Input directory within the Cloud Storage bucket to monitor for changes. |
| **directories.target** | `cache` | Output directory within the Cloud Storage bucket where the source hierarchy is mirrored, and possibly altered by the configured **actions** for a matching rule. |

### File Types
The only file type that has special significance is `image`; other file types may be defined to simplify your rules. The **optiimise** function in [file.js](file.js) detects whether a file is an image based on the configured `image` file type.

| option | default | description |
| :----- | :------ | :---------- |
| **filetypes[name].match** |  | Regular expression matching the relative path of the object in the event |

Example:

```json
{
  "filetypes": {
    "image": {
      "match": "\\.(png|jpg|gif)$"
    },
    "json": {
      "match": "\\.json$"
    }
  }
}
```

### Actions
Predefined actions can be referenced in the **Rules** section by name. By default, all exported functions in the [file](file.js) module are available to rules as actions. All other actions have to be defined in the configuration before they can be referenced in a rule.

| option | default | description |
| :----- | :------ | :---------- |
| **actions[name].module** | `"file"` | Name of a JavaScript module within **@growit-io/google-cloud-storage-function** without the `.js` suffix |
| **actions[name].function** | `name` | Name of an exported function in the module. Defaults to the name of the defined action. |
| **actions[name].options** | `{}` | Options to pass as `options` argument to the action function |

### Rules
Rules are evaluated sequentially for each change event emitted by the Cloud Storage bucket that relates to a *file object* within **directories.source**. Events for directories and file objects outside of the source directory are ignored. If a rule matches, then its **actions** are run in sequence and the rule evaluation stops, unless the rule has **continue** set to `true`.

| option | default | description |
| :----- | :------ | :---------- |
| **rules[].events** | | Names of event types to match (`"add"`, `"update"`, `"delete"`) |
| **rules[].filetypes** | | Names of defined **File Types** the object in the event must match |
| **rules[].match** | | Regular expression matched against the path of the object in the event |
| **rules[].actions** | `[]` | Names of defined **Actions** to run in sequence, if this rule matches |
| **rules[].continue** | `false` | Whether to continue evaluation of other rules, if this one matches |

## Development
    npm install --dev
    mkdir -p content
    npm run watch

## Changelog
See [CHANGELOG.md](CHANGELOG.md).

## License
See the [LICENSE](LICENSE) file.
