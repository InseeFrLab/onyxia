import React, { useState, useEffect } from 'react';

export default (
	{
		leaf: Leaf = () => null,
		node: Node = () => null,
		root: Root = () => null,
		isLeaf = async () => Promise.resolve(false),
		isRoot = async () => Promise.resolve(false),
	} = {
		leaf: () => null,
		node: () => null,
		root: () => null,
		isLeaf: async () => Promise.resolve(false),
		isRoot: async () => Promise.resolve(false),
	}
) => (props) => {
	const [location, setLocation] = useState(props.location.pathname);
	const [isRoot_, setIsRoot] = useState(false);
	const [isLeaf_, setIsLeaf] = useState(false);
	const [init, setInit] = useState(false);
	const current = window.location.pathname;

	useEffect(() => {
		let unmount = false;
		const verify = async (current) => {
			const isLeaf__ = await isLeaf(window.location);
			const isRoot__ = await isRoot(window.location);
			if (!unmount) {
				setLocation(window.location.pathname);
				setIsLeaf(isLeaf__);
				setIsRoot(isRoot__);
				setInit(true);
			}
		};
		if (!init || location !== current) {
			verify();
		}
		return () => (unmount = true);
	}, [init, current, location]);
	return init ? (
		isRoot_ ? (
			<Root {...props} location={location} />
		) : isLeaf_ ? (
			<Leaf {...props} location={location} />
		) : (
			<Node {...props} location={location} />
		)
	) : null;
};
/*class VariableLocation extends React.Component {
    first = false;
    state = { location: null, sealed: false, isLeaf: false, isRoot: false };
    constructor(props) {
      super(props);
      this.state.location = window.location.pathname;
    }

    static getDerivedStateFromProps = (props, state) => {
      const location = window.location.pathname;
      if (location !== state.location) {
        return { ...state, location };
      }
      return state;
    };

    async componentDidMount() {
      const isRoot_ = await isRoot(window.location);
      const isLeaf_ = await isLeaf(window.location);
      this.setState({ isLeaf: isLeaf_, isRoot: isRoot_ });
    }

    async componentDidUpdate() {
      const isRoot_ = await isRoot(window.location);
      const isLeaf_ = await isLeaf(window.location);
      if (isLeaf_ !== this.state.isLeaf || isRoot_ !== this.state.isRoot) {
        this.setState({ isLeaf: isLeaf_, isRoot: isRoot_ });
      }
    }

    render() {
      if (!this.first) {
        this.first = true;
        return null;
      }
      const { location, isLeaf, isRoot } = this.state;
      return isRoot ? (
        <Root {...this.props} location={location} />
      ) : isLeaf ? (
        <Leaf {...this.props} location={location} />
      ) : (
        <Node {...this.props} location={location} />
      );
    }
  };*/
