To perform complex queries you first need describe the query in an index.yaml file, and then load it to the datastore. 
This enables datastore to create the proper indexing structure to resolve the queries. 

--Example--
The current index.yaml file includes an example index structure:

	- kind: Task
  	  properties:
  	  - name: slackID
  	  - name: location

This structure enables running the query:

	 datastore
	.createQuery('Task')
	.select('location')
	.filter('slackID','=',slackUserID);

--Updating index.yaml--
After updating the index.yaml file, upload the new version to datastore using the command:
	'gcloud datastore indexes create [PATH]' Where path is the path to the index file. 

--Documentation--
Current index structure: https://console.cloud.google.com/datastore/indexes?authuser=1&organizationId=247721031950&project=ally-be86e
Indexing Documentation: https://cloud.google.com/appengine/docs/standard/nodejs/configuring-datastore-indexes-with-index-yaml