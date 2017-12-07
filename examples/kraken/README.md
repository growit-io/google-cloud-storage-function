# Optimising images with Kraken.io
Background Function which monitors a Cloud Storage bucket and optimises any images uploaded to the `content/` directory with [Kraken.io](https://kraken.io/). The optimised images are written to the `cache/` directory.

## Prerequisites
- Google Cloud SDK and the `beta` components installed and configured on your machine.
- An [API key and secret](https://kraken.io/pricing) for Kraken.io.
- Some images to optimise.

## Initial Setup
1. Edit the file [config.json](config.json) to enter your API key and secret as **kraken.api_key** and **kraken.api_secret**.
2. Create two globally unique buckets. Only the first bucket will be monitored for changes; the second one is needed temporarily in order to deploy the function.

       uuid=`uuidgen | tr '[:upper:]' '[:lower:]'`
       gsutil mb gs://content-$uuid/
       gsutil mb gs://stage-$uuid/

3. Deploy this function from the current directory into the same Google Cloud project as the two buckets.

       gcloud beta functions deploy kraken --source .  --stage-bucket stage-$uuid --trigger-bucket content-$uuid

## Testing
1. Upload an image to the `/content` directory of the bucket that you specified as `--trigger-bucket` before.
2. Wait a few seconds. It usually takes less than 30 seconds until the Cloud Function is actually triggered.
3. The file you just uploaded should now be in the `/cache` directory as well, but smaller in size.
4. Delete the file which you just uploaded from the `/content` directory.
5. The extra copy in the `/cache` directory should disappear within a few seconds.
