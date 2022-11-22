import { connect } from "react-redux";
import { actions } from "js/redux/legacyActions";
import { MyFile as MyFileUnconnected } from "./my-file.component";

const { startWaiting, stopWaiting } = actions;

export const MyFile = connect(undefined, {
    startWaiting,
    stopWaiting
})(MyFileUnconnected);
