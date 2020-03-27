const exportTypes = [
	{
		id: 'python',
		label: 'Python',
		text: (c) =>
			`le texte python :
access key id: ${c.AWS_ACCESS_KEY_ID}
s3 endpoint: ${c.AWS_S3_ENDPOINT}`,
	},
	{
		id: 'r',
		label: 'R',
		text: (c) =>
			`le texte R :
access key id: ${c.AWS_ACCESS_KEY_ID}
s3 endpoint: ${c.AWS_S3_ENDPOINT}`,
	},
];

export default exportTypes;
