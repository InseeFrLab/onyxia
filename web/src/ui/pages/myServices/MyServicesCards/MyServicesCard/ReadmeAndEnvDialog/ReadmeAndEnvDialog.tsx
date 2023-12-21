import { useMemo, useState } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { useTranslation } from "ui/i18n";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";
import { smartTrim } from "ui/tools/smartTrim";
import { Dialog } from "onyxia-ui/Dialog";
import { Markdown } from "onyxia-ui/Markdown";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CopyOpenButton } from "./CopyOpenButton";

type Props = {
    evtAction: NonPostableEvt<"SHOW ENV" | "SHOW POST INSTALL INSTRUCTIONS">;
    startTime: number | undefined;
    openUrl: string | undefined;
    projectServicePassword: string;
    getPostInstallInstructions: (() => string) | undefined;
    getEnv: () => Record<string, string>;
};

export function ReadmeAndEnvDialog(props: Props) {
    const {
        evtAction,
        startTime,
        openUrl,
        projectServicePassword,
        getPostInstallInstructions,
        getEnv
    } = props;

    const [dialogDesc, setDialogDesc] = useState<
        | { dialogShowingWhat: "env"; env: Record<string, string> }
        | {
              dialogShowingWhat: "postInstallInstructions";
              projectServicePassword: string;
              postInstallInstructions: string;
          }
        | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtAction.attach(
                action => action === "SHOW ENV",
                ctx,
                () =>
                    setDialogDesc({
                        "dialogShowingWhat": "env",
                        "env": getEnv()
                    })
            );

            evtAction.attach(
                action => action === "SHOW POST INSTALL INSTRUCTIONS",
                ctx,
                async () => {
                    setDialogDesc({
                        "dialogShowingWhat": "postInstallInstructions",
                        projectServicePassword,
                        "postInstallInstructions": getPostInstallInstructions?.() ?? ""
                    });
                }
            );
        },
        [evtAction, projectServicePassword]
    );

    const onDialogClose = useConstCallback(() => setDialogDesc(undefined));

    const { classes } = useStyles();

    const { t } = useTranslation({ ReadmeAndEnvDialog });

    const { dialogBody, dialogButtons } = useMemo(() => {
        if (dialogDesc === undefined) {
            return {};
        }
        const dialogBody = (() => {
            switch (dialogDesc.dialogShowingWhat) {
                case "postInstallInstructions":
                    return dialogDesc.postInstallInstructions;
                case "env":
                    return Object.entries(dialogDesc.env)
                        .filter(([, value]) => value !== "")
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(
                            ([key, value]) =>
                                `**${key}**: \`${smartTrim({
                                    "text": value,
                                    "minCharAtTheEnd": 4,
                                    "maxLength": 40
                                })}\`  `
                        )
                        .join("\n");
            }
        })();

        const dialogButtons = (() => {
            switch (dialogDesc.dialogShowingWhat) {
                case "postInstallInstructions":
                    return (
                        <>
                            <Button variant="secondary" onClick={onDialogClose}>
                                {t("return")}
                            </Button>
                            {startTime === undefined ? (
                                <CircularProgress
                                    className={classes.circularProgress}
                                    color="textPrimary"
                                    size={20}
                                />
                            ) : (
                                openUrl !== undefined && (
                                    <CopyOpenButton
                                        openUrl={openUrl}
                                        servicePassword={extractServicePasswordFromPostInstallInstructions(
                                            {
                                                "postInstallInstructions":
                                                    dialogDesc.postInstallInstructions,
                                                "projectServicePassword":
                                                    dialogDesc.projectServicePassword
                                            }
                                        )}
                                        onDialogClose={onDialogClose}
                                    />
                                )
                            )}
                        </>
                    );
                case "env":
                    return (
                        <Button variant="secondary" onClick={onDialogClose}>
                            {t("ok")}
                        </Button>
                    );
            }
        })();

        return { dialogBody, dialogButtons };
    }, [dialogDesc, startTime, openUrl, t]);

    return (
        <Dialog
            body={
                dialogBody && (
                    <div className={classes.dialogBody}>
                        <Markdown>{dialogBody}</Markdown>
                    </div>
                )
            }
            isOpen={dialogDesc !== undefined}
            onClose={onDialogClose}
            buttons={dialogButtons ?? null}
        />
    );
}

function extractServicePasswordFromPostInstallInstructions(params: {
    postInstallInstructions: string;
    projectServicePassword: string;
}): string | undefined {
    const { postInstallInstructions, projectServicePassword } = params;

    if (postInstallInstructions.includes(projectServicePassword)) {
        return projectServicePassword;
    }

    const regex = /password: ?([^\n ]+)/i;

    const match = postInstallInstructions.match(regex);

    if (match === null) {
        return undefined;
    }

    return match[1];
}

const useStyles = tss.withName({ ReadmeAndEnvDialog }).create(({ theme }) => ({
    "dialogBody": {
        "maxHeight": 450,
        "overflow": "auto"
    },
    "circularProgress": {
        ...theme.spacing.rightLeft("margin", 3)
    }
}));

export const { i18n } = declareComponentKeys<"ok" | "return">()({ ReadmeAndEnvDialog });
