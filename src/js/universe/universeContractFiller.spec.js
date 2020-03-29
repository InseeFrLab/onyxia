import serviceToDeploy from './test-data/serviceToDeploy.json';
import context from './test-data/context.json';
import expected from './test-data/expected.json';
import getDefaultOptions, {
	getDefaultSingleOption,
} from './universeContractFiller';

it('should replace single option with context data', () => {
	expect(
		getDefaultSingleOption(
			{
				type: 'string',
				description: 'git config --global user.name',
				title: 'Username',
				default: 'whatever',
				'api-defined': true,
				'api-default': '[$USERNAME]',
				'js-control': 'ro',
				'api-control': 'strict',
			},
			context
		)
	).toEqual(context.USERNAME);
});
it('produces contract', () => {
	const data = getDefaultOptions(serviceToDeploy.config.properties, context);
	console.log(data);
	expect(data).toEqual(expected);
});
