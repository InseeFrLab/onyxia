import React from "react";
import PropTypes from "prop-types";
import { JsonEditor } from "jsoneditor-react";
import "jsoneditor-react/es/editor.min.css";

const Editor = ({ json, onChange, readOnly }) => (
  <JsonEditor
    value={json}
    onChange={onChange}
    mode="code"
    allowedModes={["code", "tree"]}
    onEditable={() => !readOnly}
  />
);

Editor.defaultProps = {
  json: {},
  onChange: () => {},
  readOnly: false
};

Editor.propTypes = {
  json: PropTypes.object,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool
};

export default Editor;
