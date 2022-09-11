import React from "react";
import { useEffect } from "react";
import {
    Typography,
    Paper,
    Button,
    Icon,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import { Ligne } from "js/components/commons/Ligne";
import Toolbar from "./toolbar.component";
import Progress from "js/components/commons/progress";
import CopyableField from "js/components/commons/copyable-field";

import { getMinioClient, getMinioToken } from "js/minio-client/minio-client";
import * as minioTools from "js/minio-client/minio-tools";
import getMinioApi from "js/minio-client/minio-api";
import * as minioPolicy from "js/minio-client/minio-policy";
import { id } from "tsafe/id";
import type { actions } from "js/redux/legacyActions";
import { assert } from "tsafe/assert";
import type { HandleThunkActionCreator } from "react-redux";
import { routes } from "ui/routes";

import { MyPolicy } from "../my-policy.component";
import "./my-files.scss";

export type Props = {
    files: (Blob & { name: string })[];
    directories: { prefix: string }[];
    bucketName: string;
    refresh: () => void;
    path: string;
    loadBucketContent: HandleThunkActionCreator<typeof actions["loadBucketContent"]>;
    uploadFileToBucket: HandleThunkActionCreator<typeof actions["uploadFileToBucket"]>;
    removeObjectFromBucket: HandleThunkActionCreator<
        typeof actions["removeObjectFromBucket"]
    >;
    startWaiting: HandleThunkActionCreator<typeof actions["startWaiting"]>;
    stopWaiting: HandleThunkActionCreator<typeof actions["stopWaiting"]>;
};

type State = {
    directoryPath: string;
    precPath: string | undefined;
    files: Props["files"] | undefined;
    filePath: string | undefined;
    uploadSeq: boolean;
    checkedFiles: Record<string, boolean>;
    sizeTotal: number;
    sizeCurrent: number;

    policy: { Resource: string[] } | undefined;
    isInPublicDirectory: boolean;
    isPublicDirectory: boolean;
    popupUploadLink: boolean;
};

export class MyFiles extends React.Component<Props, State> {
    unmount = false;
    state: State = {
        "directoryPath": "",
        "precPath": undefined,
        "files": undefined,
        "filePath": undefined,
        "uploadSeq": false,
        "checkedFiles": {},
        "sizeTotal": 0,
        "sizeCurrent": 0,
        //
        "policy": undefined,
        "isInPublicDirectory": false,
        "isPublicDirectory": false,
        "popupUploadLink": false,
    };
    input = React.createRef<HTMLInputElement>();
    stream: (Blob["stream"] & { destroy?: () => void }) | null = null;

    constructor(props: Props) {
        super(props);
        this.state.precPath = props.path;
        this.checkFolderStatus();
    }

    static getDerivedStateFromProps({ files }: Props, state: State) {
        const checkedFiles = files.reduce(
            (a, { name }) => ({
                ...a,
                [name]: state.checkedFiles[name] || false,
            }),
            {},
        );
        return { ...state, checkedFiles };
    }

    componentDidUpdate = async () => {
        if (this.state.precPath !== this.props.path) {
            this.setState({ precPath: this.props.path });
            await this.checkFolderStatus();
        }
    };

    handleChangeDirectory = (e: { target: { value: string } }) =>
        this.setState({ directoryPath: e.target.value });

    handleCheck = (name: string) => (e: { target: { checked: boolean } }) =>
        this.setState({
            checkedFiles: {
                ...this.state.checkedFiles,
                [name]: e.target.checked,
            },
        });

    checkedAllFiles = (e: { target: { checked: boolean } }) =>
        this.setState({
            checkedFiles: Object.keys(this.state.checkedFiles).reduce(
                (a, k) => ({ ...a, [k]: e.target.checked }),
                {},
            ),
        });

    deleteFiles = () => {
        const checked = Object.entries(this.state.checkedFiles).reduce(
            (a, [name, etat]) => (etat ? [...a, name] : a),
            id<string[]>([]),
        );
        if (checked.length > 0) {
            const promises = checked.map(name =>
                this.props.removeObjectFromBucket({
                    objectName: name,
                    bucketName: this.props.bucketName,
                }),
            );

            Promise.all(promises).then(() => {
                this.props.refresh();
            });
        }
    };

    handleChangeFile = (e: { target: { value: string; files: FileList | null } }) => {
        assert(e.target.files !== null);

        this.setState({
            "files": Object.values(e.target.files),
            "filePath": e.target.value,
        });
    };

    stopStream = () => {
        if (this.stream && this.stream.destroy) {
            this.stream.destroy();
            //this.props.consumeDownloadedFile();
            this.setState({ "uploadSeq": false });
        }
    };

    upload = () => {
        const { files } = this.state;

        assert(!!files);

        const { bucketName, uploadFileToBucket, path } = this.props;
        this.setState({
            uploadSeq: true,
            sizeTotal: files.reduce((a, { size }) => a + size, 0),
            sizeCurrent: 0,
        });

        const promises = files.map(file =>
            uploadFileToBucket({
                path: path[path.length - 1] === "/" ? path.slice(1, -1) : path.slice(1),
                file,
                bucketName: bucketName,
                notify: this.notifyUpload,
            }),
        );

        Promise.all(promises).then(() => {
            this.setState({
                files: undefined,
                filePath: undefined,
                uploadSeq: false,
            });
            this.props.refresh();
        });
    };

    createDirectory = () => {
        const file: NonNullable<State["files"]>[number] = Object.assign(
            new Blob(["Test,Text"], { type: "text/csv" }),
            { "name": ".keep" },
        );

        var path =
            this.props.path.slice(1).length > 0 ? `${this.props.path.slice(1)}` : "";
        if (path.length > 0 && !path.endsWith("/")) {
            path = path + "/";
        }
        const { directoryPath } = this.state;

        const completePath = `${path}${directoryPath}`;
        this.props
            .uploadFileToBucket({
                path: completePath,
                file,
                bucketName: this.props.bucketName,
                notify: () => null,
            })
            .then(() => {
                this.props.refresh();
                this.setState({ directoryPath: "" });
            })
            .catch(() => {});
    };

    notifyUpload = (msg: string, params: Blob) => {
        if (msg === "data") {
            const { size, stream } = params;
            this.stream = stream;
            this.setState({ sizeCurrent: this.state.sizeCurrent + size });
        } else if (msg === "end") {
            this.stream = null;
        }
    };

    componentWillUnmount() {
        this.unmount = true;
    }
    /*
     *
     */

    checkFolderStatus = () => {
        const fetchStatus = async () => {
            this.props.startWaiting();
            const { bucketName, path } = this.props;
            try {
                const subDirectories = getSubDirectories(bucketName)(path);
                subDirectories.pop();
                const minioPath = `${getMinioPath(bucketName)(path)}*`;
                const policy = await fetchPolicy(bucketName);
                if (!this.unmount) {
                    if (policy) {
                        const { Resource } = policy;
                        const isInPublicDirectory = subDirectories.reduce(
                            (a, path) => Resource.indexOf(path) !== -1 || a,
                            false,
                        );
                        const isPublicDirectory =
                            policy.Resource.indexOf(minioPath) !== -1;
                        this.setState({
                            policy,
                            isInPublicDirectory,
                            isPublicDirectory,
                        });
                    } else {
                        this.setState({
                            policy: undefined,
                            isInPublicDirectory: false,
                            isPublicDirectory: false,
                        });
                    }
                }
            } catch ({ code, name, ...rest }) {
                console.debug("debug", { code, name, ...(rest as any) });
                if (code === "NoSuchBucketPolicy") {
                    await minioTools.initBucketPolicy(bucketName);
                    await this.checkFolderStatus();
                }
            }

            this.props.stopWaiting();
        };

        if (!this.unmount) return fetchStatus();
    };

    unlockDirectory = async () => {
        this.props.startWaiting();
        const { bucketName, path } = this.props;
        try {
            const minioPath = getMinioPath(bucketName)(path);
            const policy = await minioPolicy.createPolicyWithDirectory(bucketName)(
                `${minioPath}*`,
            );
            await minioTools.setBucketPolicy({ bucketName, policy });
            await this.checkFolderStatus();
        } catch (e) {
            // TODO
        }
        return false;
    };

    lockDirectory = async () => {
        this.props.startWaiting();
        const { bucketName, path } = this.props;
        try {
            const minioPath = getMinioPath(bucketName)(path);
            const policy = await minioPolicy.createPolicyWithoutDirectory(bucketName)(
                `${minioPath}*`,
            );
            await minioTools.setBucketPolicy({ bucketName, policy });
            await this.checkFolderStatus();
        } catch (e) {
            // TODO
        }
        return false;
    };

    deletePublicDirectory = async (minioPath: string) => {
        this.props.startWaiting();
        const { bucketName } = this.props;
        try {
            const policy = await minioPolicy.createPolicyWithoutDirectory(bucketName)(
                minioPath,
            );
            await minioTools.setBucketPolicy({ bucketName, policy });
            await this.checkFolderStatus();
        } catch (e) {
            // TODO
        }

        return false;
    };

    render() {
        const { files, directories, bucketName, path } = this.props;
        const { isPublicDirectory, isInPublicDirectory, policy } = this.state;

        const paths = path
            .split("/")
            .filter(f => f.length > 0)
            .reduce(
                (a, f) =>
                    a.length === 0
                        ? [{ label: f, path: `/${f}/` }]
                        : [
                              ...a,
                              {
                                  label: f,
                                  path: `${a[a.length - 1].path}${f}/`,
                              },
                          ],
                id<{ label: string; path: string }[]>([]),
            );
        return (
            <>
                <div className="en-tete">
                    <Typography
                        variant="h2"
                        align="center"
                        color="textPrimary"
                        gutterBottom
                    >
                        {`Parcourez votre dépôt ${bucketName}`}
                    </Typography>
                </div>
                <FilDAriane fil={fil.myFiles(bucketName)(paths)} />
                <div className="contenu my-files">
                    <Toolbar
                        isInPublicDirectory={isInPublicDirectory}
                        isPublicDirectory={isPublicDirectory}
                        deleteFiles={
                            Object.keys(this.state.checkedFiles).length > 0
                                ? this.deleteFiles
                                : undefined
                        }
                        lockDirectory={this.lockDirectory}
                        unlockDirectory={this.unlockDirectory}
                        createUploadLink={() => this.setState({ popupUploadLink: true })}
                    />
                    <DialogShare
                        visible={this.state.popupUploadLink}
                        bucket={bucketName}
                        onClose={() => this.setState({ popupUploadLink: false })}
                    />
                    <Paper className="paragraphe" elevation={1}>
                        <Typography variant="h3" gutterBottom>
                            {`${bucketName}${path}`}
                        </Typography>
                        <div className="liens">
                            {files.length > 1 ? (
                                <div className="entry">
                                    <Checkbox
                                        className="select-it"
                                        onChange={this.checkedAllFiles}
                                    />
                                </div>
                            ) : null}
                            {directories.length === 0 && files.length === 0 ? (
                                <Typography variant="body1" gutterBottom>
                                    Cet espace est vide ou en cours de chargement.
                                </Typography>
                            ) : null}
                            {directories.map((d, i) => (
                                <Ligne
                                    key={i}
                                    linkProps={
                                        routes.myFilesLegacy({
                                            bucketName,
                                            "fileOrDirectoryPath": d.prefix,
                                        }).link
                                    }
                                    icone="folder"
                                    name={getName(d.prefix)}
                                />
                            ))}
                            {files.map(({ name }, i) => (
                                <Ligne
                                    key={i}
                                    linkProps={
                                        routes.myFilesLegacy({
                                            bucketName,
                                            "fileOrDirectoryPath": name,
                                        }).link
                                    }
                                    icone="description"
                                    name={getName(name)}
                                    color="primary"
                                    checked={this.state.checkedFiles[name]}
                                    handleCheck={this.handleCheck(name)}
                                />
                            ))}
                        </div>
                    </Paper>
                    <Paper className="paragraphe" elevation={1}>
                        <Typography variant="h3" gutterBottom>
                            Uploader un fichier dans le répertoire courant
                        </Typography>
                        <File files={this.state.files} />
                        <input
                            aria-hidden="true"
                            type="file"
                            multiple={true}
                            style={{ display: "none" }}
                            ref={this.input}
                            onChange={this.handleChangeFile}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => this.input.current!.click()}
                        >
                            Choisissez un ou plusieurs fichiers
                        </Button>
                        {this.state.files ? (
                            <div className="upload-button">
                                <Fab color="primary" onClick={this.upload}>
                                    <Icon className="icone-bouton">cloud_upload</Icon>
                                </Fab>
                            </div>
                        ) : null}
                    </Paper>
                    <Paper className="paragraphe" elevation={1}>
                        <Typography variant="h3" gutterBottom>
                            Créer un Répertoire
                        </Typography>
                        <TextField
                            label="Chemin du répertoire"
                            value={this.state.directoryPath}
                            onChange={this.handleChangeDirectory}
                            margin="normal"
                        />
                        <Button
                            disabled={!isValidePath(this.state.directoryPath)}
                            variant="contained"
                            color="primary"
                            onClick={this.createDirectory}
                        >
                            Créer un répertoire.
                        </Button>
                        <Typography variant="body2" gutterBottom>
                            Le nom doit commencer par un caractère ou un chiffre. Pour
                            détruire ce répertoire, il suffit de supprimer tout ce qu'il
                            contient.
                        </Typography>
                    </Paper>
                    <MyPolicy handleDelete={this.deletePublicDirectory} policy={policy} />
                </div>
                <Progress
                    display={this.state.uploadSeq}
                    handleClose={this.stopStream}
                    percent={
                        (this.state.sizeCurrent / (this.state.sizeTotal + 0.01)) * 100
                    }
                />
            </>
        );
    }
}

const DialogShare: React.FC<{
    visible: boolean;
    bucket: string;
    onClose: () => void;
}> = ({ visible, bucket, onClose }) => {
    const [signedData, setSignedData] = React.useState<{
        postURL: string;
        formData: Record<string, string>;
    }>();
    const [folder, setFolder] = React.useState("");
    const [duration, setDuration] = React.useState(12 * 3600);

    const getCurlCommand = () => {
        assert(!!signedData);

        const parameters = Object.entries(signedData.formData)
            .filter(data => data[0] !== "key")
            .map(data => `-F ${data[0]}=${data[1]}`)
            .join(" ");
        return `curl ${signedData.postURL} -F file=@<FILE> -F key=${signedData.formData.key}<NAME> ${parameters}`;
    };

    useEffect(() => {
        if (folder.length > 0) {
            getMinioClient().then(client =>
                getMinioApi(client)
                    .presignedPostBucket(bucket, folder, duration)
                    .then(signedData =>
                        getMinioToken().then(({ sessionToken }) =>
                            setSignedData({
                                ...signedData,
                                formData: {
                                    ...signedData.formData,
                                    "x-amz-security-token": sessionToken,
                                },
                            }),
                        ),
                    ),
            );
        }
    }, [folder, duration, bucket]);

    const durations = [
        {
            value: 2 * 3600,
            label: "2 heures",
        },
        {
            value: 8 * 3600,
            label: "8 heures",
        },
        {
            value: 12 * 3600,
            label: "12 heures",
        },
    ];

    return (
        <Dialog open={visible} onClose={onClose}>
            <DialogTitle>Partager un lien d'upload</DialogTitle>
            <DialogContent>
                <Typography variant="body2" gutterBottom>
                    Créer un lien d'upload vous permet de partager un lien avec un
                    partenaire. Ce lien lui permettra d'uploader un fichier sans posséder
                    de droits supplémentaires.
                </Typography>
                <TextField
                    label="Dossier de destination"
                    value={folder}
                    onChange={e => {
                        setFolder(e.target.value);
                    }}
                />
                <br />
                <TextField
                    label="Durée de validité"
                    select
                    value={duration}
                    onChange={e => {
                        setDuration(parseInt(e.target.value));
                    }}
                >
                    {durations.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <br />
                {signedData && folder ? (
                    <>
                        <br />
                        Avec la commande suivante, le partenaire pourra uploader des
                        fichiers dans le dossier <strong>{folder}</strong>
                        <br />
                        <CopyableField value={getCurlCommand()} copy></CopyableField>
                    </>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button color="primary" autoFocus onClick={onClose}>
                    Terminé
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const File: React.FC<{ files?: Props["files"] }> = ({ files }) =>
    files ? (
        <>
            {files.map((file, i) => (
                <div key={i} className="dialogue-upload">
                    <span> {`nom : ${file.name}`}</span>
                    <span> {`taille : ${file.size}ko`}</span>
                </div>
            ))}
        </>
    ) : (
        <div>vous n&rsquo;avez pas choisi de fichier</div>
    );

const isValidePath = (path: string) =>
    path && path.trim().length > 0 ? path.toLowerCase().match(/^[a-z0-9]/i) : false;

const getName = (name: string) =>
    name
        .split("/")
        .filter(f => f.length > 0)
        .reduce((...[, v]) => v);

/* 
    outils de gestion pour les policies sur répertoire.

*/

const getMinioPath = (bucketName: string) => (path: string) =>
    minioTools.getMinioDirectoryName(bucketName)(path.trim().length === 0 ? "/" : path);

const getSubDirectories = (bucketName: string) => (directory: string) => {
    const tokens = directory.split("/").filter(p => p.trim().length !== 0);

    if (tokens.length === 0) return [];

    const tmp = ["", ...tokens].reduce(
        (a, subpath) => ({
            current: `${a.current}${subpath}/`,
            stack: [
                ...a.stack,
                minioTools.getMinioDirectoryName(bucketName)(`${a.current}${subpath}/*`),
            ],
        }),
        { current: "", stack: id<string[]>([]) },
    );
    const { stack } = tmp;
    return stack;
};

const fetchPolicy = async (bucketName: string) => {
    const policyString = await minioTools.getBucketPolicy(bucketName);

    const {
        Statement: [policy],
    } = JSON.parse(policyString);

    return policy;
};
