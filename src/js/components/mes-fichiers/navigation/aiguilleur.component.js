import React from "react";
import MyFiles from "./my-files";
import MyFile from "./my-file";

import { isBucketExist, createBucket } from "js/minio-client";

class NavigationFile extends React.Component {
  state = {
    bucketName: undefined,
    pathname: undefined,
    racine: undefined,
    bucketExist: false
  };

  constructor(props) {
    super(props);
    const { bucketName } = props.match.params;
    this.state.bucketName = bucketName;
    this.state.racine = `/mes-fichiers/${bucketName}`;
    this.state.pathname = decodeURI(window.location.pathname);


    this.init();
  }

  init = async () => {
    this.props.startWaiting();
    if (!this.props.user || !this.props.user.IDEP) {
      await this.props.getUserInfo();
    }

    if (this.props.buckets.length === 0) {
      await this.props.loadUserBuckets(this.props.user.IDEP);
    }
    const bucket = this.props.buckets.find(b => b.id === this.state.bucketName);

    if (bucket) {
      await openBucket(bucket);
      this.setState({ bucketExist: true });
      this.refresh();
      this.props.stopWaiting();
      return true;
    }
    this.props.stopWaiting();
    return false;
  };

  refresh = () => {
    this.props.loadBucketContent(
      this.state.bucketName,
      this.state.pathname.replace(`${this.state.racine}`, ""),
      false
    );
  };

  static getDerivedStateFromProps = (props, state) => {
    const { pathname, bucketName, racine } = state;
    const where = decodeURI(window.location.pathname);

    if (where !== pathname) {
      props.loadBucketContent(
        bucketName,
        where.replace(`${racine}`, ""),
        false
      );
      return {
        ...state,
        pathname: where
      };
    }
    return { ...state };
  };

  render() {
    const { pathname, racine, bucketName, bucketExist } = this.state;
    if (!bucketExist) return null;
    const here = pathname.replace(racine, "");
    const file = this.props.objets.find(({ name }) => name === here);
    if (file) {
      return (
        <MyFile
          fileName={decodeURI(here).substr(1)}
          bucketName={bucketName}
          file={file}
          refresh={this.refresh}
          path={decodeURI(pathname.replace(racine, ""))}
        />
      );
    }
    const { objets, directories } = this.props;
    return (
      <MyFiles
        files={objets}
        directories={directories}
        bucketName={bucketName}
        refresh={this.refresh}
        path={pathname.replace(racine, "")}
      />
    );
  }
}

export default NavigationFile;

const openBucket = async ({ id }) =>
  (await isBucketExist(id)) ? true : createBucket(id);
