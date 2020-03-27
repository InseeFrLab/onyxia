import React from 'react';
import PropTypes from 'prop-types';
import removeAccents from 'remove-accents';
import { TextField, InputAdornment, Icon } from '@material-ui/core';
import RootRef from '@material-ui/core/RootRef';
import { HidablePane } from 'js/components/commons/atoms';
import './chips-selector.scss';

const getChips = (search) => (chips) =>
	chips.reduce((a, r) => (isChipCandidate(search)(r) ? [...a, r] : a), []);

const isChipCandidate = (search) => (chip) =>
	search.trim() !== '' && chip.value.startsWith(search);

class Searchbar extends React.Component {
	state = {
		search: '',
		chipsSelected: [],
		chipsCandidates: [],
		displayPropositions: false,
	};
	numTimer = null;
	search = React.createRef();

	handleChange = (e) => {
		const search = removeAccents(e.target.value.trim()).toLowerCase();
		let displayPropositions = false;
		let chipsCandidates = [];
		if (search !== '') {
			chipsCandidates = getChips(search)(this.props.chips).filter(
				(c) => this.state.chipsSelected.indexOf(c) === -1
			);
			displayPropositions = chipsCandidates.length > 0;
		}

		this.setState({
			search: e.target.value,
			chipsCandidates,
			displayPropositions,
		});
	};

	addChip = (chip) => {
		this.setState(() => {
			const chipsCandidates = this.state.chipsCandidates.filter(
				(c) => c !== chip
			);
			const displayPropositions = chipsCandidates.length > 0;

			return {
				chipsSelected: [...this.state.chipsSelected, chip],
				chipsCandidates,
				displayPropositions,
			};
		});
		this.props.addChip(chip);
	};

	removeChip = (chip) => {
		this.setState(() => {
			return {
				chipsSelected: this.state.chipsSelected.filter((c) => c !== chip),
				chipsCandidates: isChipCandidate(this.state.search)(chip)
					? [...this.state.chipsCandidates, chip]
					: [...this.state.chipsCandidates],
			};
		});
		this.props.removeChip(chip);
	};

	handleKeypress = (e) => {
		if (e.key === 'Enter' && this.state.chipsCandidates.length > 0) {
			this.addChip(this.state.chipsCandidates[0]);
		}
	};

	handleClickChip = (chip) => (etat) =>
		etat ? this.addChip(chip) : this.removeChip(chip);

	handleMouseLeave = () => {
		this.numTimer = window.setTimeout(() => {
			this.numTimer = null;
			this.setState({ displayPropositions: false });
		}, 300);
	};

	HandleMouseEnter = () => {
		this.clearTimeout();
		this.setState({ displayPropositions: true });
	};

	clearTimeout = () => {
		if (this.numTimer !== null) {
			window.clearTimeout(this.numTimer);
			this.numTimer = null;
		}
	};

	// onMouseLeave={this.handleMouseLeave}
	// onMouseEnter={() => {
	// 	this.clearTimeout();
	// 	this.setState({
	// 		displayPropositions: this.state.chipsCandidates.length > 0,
	// 	});
	// }}

	render() {
		return (
			<>
				<div className="chips-selector">
					<Selections
						chips={this.state.chipsSelected}
						handleClikChip={this.handleClickChip}
					/>
					<RootRef rootRef={this.search}>
						<TextField
							className="searchbar"
							variant="outlined"
							type="text"
							onKeyPress={this.handleKeypress}
							value={this.state.value}
							onChange={this.handleChange}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<Icon>search</Icon>
									</InputAdornment>
								),
							}}
						/>
					</RootRef>
					<HidablePane className="hidable-panel" anchor={this.search.current}>
						<Propositions
							handleClikChip={this.handleClickChip}
							chips={this.state.chipsCandidates}
							display={this.state.displayPropositions}
						/>
					</HidablePane>
					{/*<span
						onMouseEnter={this.HandleMouseEnter}
						onMouseLeave={this.handleMouseLeave}
					>
						<Propositions
							handleClikChip={this.handleClickChip}
							chips={this.state.chipsCandidates}
							display={this.state.displayPropositions}
						/>
					</span>*/}
				</div>
			</>
		);
	}
}

const Selections = ({ chips, handleClikChip }) =>
	chips.length > 0 ? (
		<div className="chips-selected">
			{chips.map((c, i) => (
				<Chip key={i} chip={c} del handleClick={handleClikChip(c)} />
			))}
		</div>
	) : null;

class Propositions extends React.Component {
	state = { index: null };
	handleKeypress = (e) => {
		e.preventDefault();

		if (e.key === 'ArrowRight') {
			this.setState({
				index: Math.min(this.props.chips.length - 1, this.state.index + 1),
			});
		} else if (e.key === 'ArrowLeft') {
			this.setState({ index: Math.max(0, this.state.index - 1) });
		} else if (e.key === 'Enter' && this.state.index !== null) {
			this.props.handleClikChip(this.props.chips[this.state.index])(true);
		}
	};

	handleFocus = () => {
		this.setState({ index: 0 });
	};

	HandleMouseEnter = () => {
		this.setState({ index: null });
	};
	// onKeyDown={this.handleKeypress}
	// onFocus={this.handleFocus}
	// onMouseEnter={this.HandleMouseEnter}
	render() {
		const { chips, display, handleClikChip } = this.props;
		return display ? (
			<div className="propositions" tabIndex="0">
				{chips.map((c, i) => (
					<Chip
						key={i}
						chip={c}
						handleClick={handleClikChip(c)}
						over={this.state.index === i}
					/>
				))}
			</div>
		) : null;
	}
}

const Chip = ({ chip, del = false, handleClick, over = false }) => (
	<span
		className={`chip ${chip.style} ${over ? 'over-chip' : null}`}
		title={chip.title}
		onClick={() => handleClick(!del)}
	>
		<span className="texte">{chip.value}</span>
		<span className="icone">
			<Icon className="symbol">{del ? 'clear' : 'add'}</Icon>
		</span>
	</span>
);

Searchbar.propTypes = {
	addChip: PropTypes.func.isRequired,
	removeChip: PropTypes.func.isRequired,
	chips: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.string.isRequired,
			style: PropTypes.string.isRequired,
			title: PropTypes.string,
		})
	),
};

export default Searchbar;
