import React, { Component } from "react";
import JSONEditor from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import "./jsoneditor.scss";

class Editor extends Component {
  componentDidMount() {
    const { json, readOnly } = this.props;
    this.jsoneditor = new JSONEditor(this.container, {
      modes: ["code", "tree"],
      onEditable: () => !readOnly
    });
    this.jsoneditor.set(json);
  }

  componentDidUpdate() {
    const { json } = this.props;
    this.jsoneditor.set(json);
  }

  componentWillUnmount() {
    if (this.jsoneditor) {
      this.jsoneditor.destroy();
    }
  }

  render() {
    return (
      <div
        className="jsoneditor-react-container"
        ref={elem => {
          this.container = elem;
        }}
      />
    );
  }
}

export default Editor;
