# Google Cloud Storage Function
Background Cloud Function which monitors a Cloud Storage bucket in the same project for changes, and mirrors objects from the `content/` directory to the `cache/` directory on add, update and delete.

## Prerequisites
- A Cloud Storage bucket to monitor in your project.
- Google Cloud SDK and the `beta` components installed and configured on your machine.

## Initial Setup
This basic example requires manual deployment of the Cloud Function via `gcloud beta functions deploy`.

1. Create two buckets *my-bucket* and *my-stage-bucket*.

       gsutil mb gs://my-bucket/
       gsutil mb gs://my-stage-bucket/

   You can quickly create two globally unique buckets that are not easily guessable with

       gsutil mb gs://my-bucket-`uuidgen | tr '[:upper:]' '[:lower:]'`/
       gsutil mb gs://my-stage-bucket-`uuidgen | tr '[:upper:]' '[:lower:]'`/

2. Deploy the Cloud Function in the same Google Cloud project as the two buckets.

       gcloud beta functions deploy monitor --source . \
         --stage-bucket my-stage-bucket \
         --trigger-bucket my-bucket

## Testing
1. Upload any file to the `/content` directory of the bucket that you specified before.
2. Wait a few seconds. It usually takes less than 30 seconds until the Cloud Function is actually triggered.
3. The file you just uploaded should now be in the `/cache` directory as well.
4. Delete the file which you just uploaded from the `/content` directory.
5. The extra copy in the `/cache` directory should disappear within a few seconds.
