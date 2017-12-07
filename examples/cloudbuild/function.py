"""Generates a Cloud Function triggered by events from a Cloud Storage bucket."""

def GenerateConfig(context):
    name = context.env['name']
    bucket = context.properties['bucket']
    resource = 'projects/' + context.env['project'] + '/buckets/' + bucket
    function = context.properties['function']
    timeout = context.properties['timeout']
    sourceRepository = context.properties['sourceRepository']
    sourceBranch = context.properties['sourceBranch']
    sourcePath = context.properties['sourcePath']
    repositoryUrl = 'https://source.developers.google.com/p/' + context.env['project'] + '/r/' + sourceRepository
    resources = [{
        'name': name,
        'type': 'cloudfunctions.v1beta2.function',
        'properties': {
            'location': 'us-central1', # The only supported region so far
            'function': function,
            'timeout': timeout,
            'sourceRepository': {
                'repositoryUrl': repositoryUrl,
                'sourcePath': sourcePath,
                'branch': sourceBranch
            },
            'eventTrigger': {
                'eventType': 'providers/cloud.storage/eventTypes/object.change',
                'resource': resource
            }
        }
    }]
    return {'resources': resources}
