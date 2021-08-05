import { getContext } from "./context";
import defaultContext from "./test-data/defaultContext.json";

xit("should create default context", () => {
    expect(getContext()).toEqual(defaultContext);
});
