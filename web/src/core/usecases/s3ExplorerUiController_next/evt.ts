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

            const { profileName, s3UriPrefixObj } = action.payload;
            const { bucket } = s3UriPrefixObj;

            const s3Profile = s3ProfilesManagement.selectors
                .s3Profiles(getState())
                .find(s3Profile => s3Profile.profileName === profileName);

            assert(s3Profile !== undefined);

            if (
                s3Profile.bookmarks.find(
                    bookmark =>
                        bookmark.isReadonly && bookmark.s3UriPrefixObj.bucket === bucket
                ) === undefined
            ) {
                return null;
            }

            return [{ profileName, s3UriPrefixObj, bucket }];
        },
        async ({ profileName, s3UriPrefixObj, bucket }) => {
            evt.post({
                action: "ask confirmation for bucket creation attempt",
                bucket: s3UriPrefixObj.bucket,
                createBucket: async () => {
                    const s3Client = await dispatch(
                        s3ProfilesManagement.protectedThunks.getS3Client({
                            profileName
                        })
                    );

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
                        dispatch(
                            thunks.listPrefix({
                                s3UriPrefixObj
                            })
                        );
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
                        routeParams.prefix === routeParams_prev.prefix
                            ? "replace"
                            : "push"
                } as const
            ],
            {
                routeParams: id<RouteParams>({
                    prefix: ""
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
