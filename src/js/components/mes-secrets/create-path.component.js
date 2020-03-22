import React from "react";

class CreatePath extends React.Component {
  state = { path: "" };

  handleChange = e => {
    this.setState({ path: e.target.value });
  };
  handleClick = e => {
    const path = this.state.path.trim();
    if (path.length > 0) {
    }
  };
  static gerDeriveredState(props, state) {
    return state;
  }
  render() {
    return (
      <div className="create-path">
        {this.props.location}/
        <input
          type="text"
          onChange={this.handleChange}
          value={this.state.path}
        />
        <button onClick={this.handleClick}>go</button>
      </div>
    );
  }
}

export default CreatePath;
