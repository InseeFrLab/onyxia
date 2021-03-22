  
import Dialog from './component';

export default {
	title: 'Dialog',
	component: Dialog,
	includeStories: [],
};

export const Confirm = () => (
	<Dialog
		open
		title="Title"
		subtitle="Subtitle"
		body="Body message"
		warn="Warn message"
		onValid={() => console.log('valid')}
		onCancel={() => console.log('cancel')}
	/>
);

Confirm.story = {
	title: 'Confirm',
};
