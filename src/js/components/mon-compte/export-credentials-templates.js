const exportTypes = [
	{
		id: 'r',
		label: 'R (aws.S3)',
		extension: 'R',
		text: (c) =>
			`install.packages("aws.s3", repos = "https://cloud.R-project.org")

Sys.setenv("AWS_ACCESS_KEY_ID" = ${c.AWS_ACCESS_KEY_ID},
           "AWS_SECRET_ACCESS_KEY" = ${c.AWS_SECRET_ACCESS_KEY},
           "AWS_DEFAULT_REGION" = ${c.AWS_DEFAULT_REGION},
           "AWS_SESSION_TOKEN" = ${c.AWS_SESSION_TOKEN},
           "AWS_S3_ENDPOINT"= ${c.AWS_S3_ENDPOINT})

library("aws.s3")
bucketlist()`,
	},
	{
		id: 'python',
		label: 'Python (fake)',
		extension: 'py',
		text: (c) =>
			`le texte python :
access key id: ${c.AWS_ACCESS_KEY_ID}
s3 endpoint: ${c.AWS_S3_ENDPOINT}`,
	},
];

export default exportTypes;
