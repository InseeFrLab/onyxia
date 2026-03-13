import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { privateSelectors, type RouteParams } from "./selectors";
import { Reflect, id } from "tsafe";
import { name } from "./state";
import { AccessError } from "clean-architecture";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import { assert } from "tsafe";
import { actions } from "./state";
import { thunks } from "./thunks";
import { getIsInside } from "core/tools/S3Uri";

export const createEvt = (({ evtAction, dispatch, getState }) => {
    const evt = Evt.create<
        | {
              action: "updateRoute";
              method: "replace" | "push";
              routeParams: RouteParams;
          }
        | {
              action: "ask confirmation for bucket creation attempt";
              bucket: string;
              createBucket: () => Promise<{ isSuccess: boolean }>;
          }
    >();

    evtAction
        .pipe(action => action.usecaseName === name)
        .pipe(() => [privateSelectors.doesListedPrefixHaveFinishedUpload(getState())])
        .pipe(onlyIfChanged())
        .attach(
            doesListedPrefixHaveFinishedUpload => doesListedPrefixHaveFinishedUpload,
            () =>
                dispatch(
                    thunks.listPrefix({
                        s3Uri: privateSelectors.s3Uri(getState()),
                        debounce: false
                    })
                )
        );

    evtAction
        .pipe(action => action.usecaseName === name)
        .attach(
            action => {
                if (action.actionName !== "deletionCompleted") {
                    return false;
                }

                const profileName = privateSelectors.profileName(getState());

                if (profileName !== action.payload.profileName) {
                    return false;
                }

                const s3Uri = privateSelectors.s3Uri(getState());

                if (s3Uri === undefined) {
                    return false;
                }

                const { isTopLevel } = getIsInside({
                    s3UriPrefix: s3Uri,
                    s3Uri: action.payload.s3Uri
                });

                if (!isTopLevel) {
                    return false;
                }

                return true;
            },
            () => {
                dispatch(
                    thunks.listPrefix({
                        s3Uri: privateSelectors.s3Uri(getState()),
                        debounce: false
                    })
                );
            }
        );

    evtAction.$attach(
        action => {
            if (action.usecaseName !== name) {
                return null;
            }

            if (action.actionName !== "listingFailed") {
                return null;
            }

            if (action.payload.errorCase !== "no such bucket") {
                return null;
            }

            const { profileName, s3Uri } = action.payload;

            const s3Profile = s3ProfilesManagement.selectors
                .s3Profiles(getState())
                .find(s3Profile => s3Profile.profileName === profileName);

            assert(s3Profile !== undefined);

            if (
                s3Profile.bookmarks.find(
                    bookmark =>
                        bookmark.isReadonly && bookmark.s3Uri.bucket === s3Uri.bucket
                ) === undefined
            ) {
                return null;
            }

            return [{ profileName, s3Uri }];
        },
        async ({ profileName, s3Uri }) => {
            evt.post({
                action: "ask confirmation for bucket creation attempt",
                bucket: s3Uri.bucket,
                createBucket: async () => {
                    const s3Client = await dispatch(
                        s3ProfilesManagement.protectedThunks.getS3Client({
                            profileName
                        })
                    );

                    const { bucket } = s3Uri;

                    const cmdId = Date.now();

                    dispatch(
                        actions.commandLogIssued({
                            cmdId,
                            cmd: `mc mb s3/${bucket}`
                        })
                    );

                    const result = await s3Client.createBucket({ bucket });

                    dispatch(
                        actions.commandLogResponseReceived({
                            cmdId,
                            resp: result.isSuccess
                                ? `Bucket \`s3/${bucket}\` created`
                                : (() => {
                                      switch (result.errorCase) {
                                          case "already exist":
                                              return `Bucket \`s3/${bucket}\` already exists`;
                                          case "access denied":
                                              return `Access denied while creating \`s3/${bucket}\`: ${result.errorMessage}`;
                                          case "unknown":
                                              return `Failed to create \`s3/${bucket}\`: ${result.errorMessage}`;
                                      }
                                  })()
                        })
                    );

                    if (result.isSuccess) {
                        dispatch(thunks.listPrefix({ s3Uri, debounce: false }));
                    }

                    return { isSuccess: result.isSuccess };
                }
            });
        }
    );

    evtAction
        .pipe(() => {
            try {
                return [privateSelectors.routeParams(getState())];
            } catch (error) {
                // NOTE: If it's too early to get the route params, we skip.
                if (!(error instanceof AccessError)) {
                    throw error;
                }

                return null;
            }
        })
        .pipe(onlyIfChanged())
        .pipe([
            (routeParams, { routeParams: routeParams_prev }) => [
                {
                    routeParams,
                    method:
                        routeParams.s3UriWithoutScheme ===
                        routeParams_prev.s3UriWithoutScheme
                            ? "replace"
                            : "push"
                } as const
            ],
            {
                routeParams: id<RouteParams>({
                    s3UriWithoutScheme: ""
                }),
                method: Reflect<"push" | "replace">()
            }
        ])
        .attach(({ method, routeParams }) => {
            evt.post({
                action: "updateRoute",
                method,
                routeParams
            });
        });

    return evt;
}) satisfies CreateEvt;
