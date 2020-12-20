import { Event } from 'js/model/Event';
import dayjs from 'dayjs';

interface Props {
	events?: Event[];
}

const Debug = ({ events = [] }: Props) => {
	return (
		<>
			{events.map((event) => (
				<div>
					{event.message} (
					{dayjs(event.timestamp).format('DD/MM/YYYY à HH:mm:ss')})
				</div>
			))}
		</>
	);
};

export default Debug;
