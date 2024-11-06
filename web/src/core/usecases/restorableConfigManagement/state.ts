import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

export type State = {
    indexedChartsIcons: {
        [catalogId: string]:
            | {
                  [chartName: string]: string | undefined;
              }
            | undefined;
    };
};

export const name = "restorableConfigManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        indexedChartsIcons: {}
    }),
    reducers: {
        initialized: (
            state,
            {
                payload
            }: {
                payload: {
                    indexedChartsIcons: State["indexedChartsIcons"];
                };
            }
        ) => {
            const { indexedChartsIcons } = payload;

            state.indexedChartsIcons = indexedChartsIcons;
        }
    }
});
