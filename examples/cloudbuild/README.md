# Google Cloud Storage Function
Background Cloud Function which monitors a Cloud Storage bucket in the same project for changes, and mirrors objects from the `content/` directory to the `cache/` directory on add, update and delete.

This is an advanced example which uses the Container Builder and Deployment Manager services to audit and automate the deployment of changes to the configuration of this Cloud Function.

## Prerequisites
- A Cloud Storage bucket to monitor in your project.
- Google Cloud SDK installed and configured on your machine.

## Initial Setup
1. Edit `config.json` and `config.yaml` to your liking. The former defines the runtime configuration of the Cloud Function, including which bucket to monitor, and the latter defines your deployment configuration.
2. Create the initial deployment of this Cloud Function. If you change the deployment name from **monitor** here, you should also have it changed in `cloudbuild.yaml`.

       gcloud deployment-manager deployments create monitor --config=config.yaml

3. Grant the **Deployment Manager Editor** role to the **project-number@cloudbuild.gserviceaccount.com** account on the [IAM & admin](https://console.cloud.google.com/iam-admin/iam/project) page for your project.
4. Create a new [Source Repository](https://console.cloud.google.com/code/develop/repo) called **monitor** in your project.
5. Set up a [Build Trigger](https://console.cloud.google.com/gcr/triggers) so that a push to the **master** branch of the **monitor** repository triggers the deployment steps layed out in `cloudbuild.yaml`.
6. Henceforth, commit and push your changes to the **monitor** repository in order to update the deployment that you created initially.
7. Go to the [Deployment Manager](https://console.cloud.google.com/deployments) page to view the deployment. If you ever suspect a problem with the deployment, check the [Build history](https://console.cloud.google.com/gcr/builds) page for your project.

## Testing
1. Upload any file to the `/content` directory of the bucket that you specified in `config.yaml`.
2. Wait a few seconds. It usually takes less than 30 seconds until the Cloud Function is actually triggered.
3. The file you just uploaded should now be in the `/cache` directory as well.
4. Delete the file which you just uploaded from the `/content` directory.
5. The extra copy in the `/cache` directory should disappear within a few seconds.
