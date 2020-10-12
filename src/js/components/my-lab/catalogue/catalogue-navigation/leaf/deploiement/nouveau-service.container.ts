import { connect } from 'react-redux';
import { NouveauService as NonConnectedNouveauService } from './nouveau-service';
import type { Props } from "./nouveau-service";
import { actions } from 'js/redux/store';
import type { RootState } from "js/redux/store";

const { creerNouveauService } = actions;

const mapStateToProps = (
	state: RootState, 
	props: Omit<Props, "creerNouveauService" | "authenticated" | "user">
) => {
	const { authenticated } = state.app;
	const { user } = state;
	return {
		...props,
		authenticated,
		user
	};
};

export const NouveauService = connect(
	mapStateToProps,
	{ creerNouveauService }
)(NonConnectedNouveauService);
