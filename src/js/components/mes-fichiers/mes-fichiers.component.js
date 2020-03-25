import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Typography, Paper, Icon } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import './mes-fichiers.scss';

class MesFichiers extends React.Component {
	state = { user: undefined, buckets: undefined };
	constructor(props) {
		super(props);
		if (!props.user) {
			this.props.getUserInfo();
		}
	}

	static getDerivedStateFromProps = (props, state) => {
		if (props.user.IDEP && !state.user) {
			props.loadUserBuckets(props.user.IDEP);
			return { user: props.user };
		}
		return state;
	};

	render() {
		const { buckets } = this.props;
		return (
			<React.Fragment>
				<div className="en-tete">
					<Typography
						variant="h2"
						align="center"
						color="textPrimary"
						gutterBottom
					>
						Vos fichiers sur Minio
					</Typography>
				</div>
				<FilDAriane fil={fil.mesFichiers} />

				<div className="contenu mes-fichiers">
					<Paper className="paper" elevation={1}>
						<Typography
							variant="h3"
							align="left"
							color="textPrimary"
							gutterBottom
						>
							La liste de vos dépots
						</Typography>
						{buckets.map(({ id, description }, i) => (
							<Bucket key={i} description={description} id={id} />
						))}
					</Paper>
				</div>
			</React.Fragment>
		);
	}
}

const Bucket = ({ id, description }) => (
	<div>
		{`${id} - ${description}`}
		<Link to={`/mes-fichiers/${id}`}>
			<Icon>open_in_new</Icon>
		</Link>
	</div>
);

const BucketType = { name: PropTypes.string.isRequired };

MesFichiers.propTypes = {
	userBuckets: PropTypes.arrayOf(BucketType),
	loadUserBuckets: PropTypes.func.isRequired,
	user: PropTypes.object,
};

export default MesFichiers;
