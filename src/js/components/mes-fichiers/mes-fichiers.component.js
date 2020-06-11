import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Typography, Paper } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import './mes-fichiers.scss';
import { getMinioClient, getMinioApi } from 'js/minio-client';

class MesFichiers extends React.Component {
	state = {
		user: undefined,
		buckets: undefined,
		client: undefined,
		api: undefined,
	};
	constructor(props) {
		super(props);
		if (!props.user) {
			this.props.getUserInfo();
		}
		this.init();
	}

	init = async () => {
		this.state.client = await getMinioClient();
		this.setState({ api: getMinioApi(this.state.client) });
	};

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
			<>
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
						<div id="bucket-list">
							{buckets.map(({ id, description }, i) => {
								return <Bucket key={i} description={description} id={id} />;
							})}
						</div>
					</Paper>
				</div>
			</>
		);
	}
}

const Bucket = ({ id, description, picture }) => (
	<Link to={`/mes-fichiers/${id}`}>
		<h4>{id}</h4>
		<h5>{description}</h5>
	</Link>
);

const BucketType = { name: PropTypes.string.isRequired };

MesFichiers.propTypes = {
	userBuckets: PropTypes.arrayOf(BucketType),
	loadUserBuckets: PropTypes.func.isRequired,
	user: PropTypes.object,
};

export default MesFichiers;
