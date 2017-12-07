# Google Cloud Storage Function
Local development mode for a Cloud Function which would normally monitor a Cloud Storage bucket for changes. In this mode, however, all storage operations are mapped to the local filesystem instead of a Cloud Storage bucket.

## Prerequisites
- The `npm` command must be installed on your machine.

## Setup
1. Review [config.json](config.json) and make changes, if you like.
2. Install the required Node.js dependencies.

       npm install

3. Watch the `content` directory for changes.

       mkdir -p content
       npm run watch

## Testing
1. Create a file in the `content` directory.
2. The file you just created should immediately appear in the `cache` directory as well.
4. Remove the file which you just created from the `content` directory.
5. The extra copy in the `cache` directory should disappear immediately.
