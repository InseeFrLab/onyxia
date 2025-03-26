import { assert, type Equals } from "tsafe/assert";

export type RestorableServiceConfigRef = {
    friendlyName: string;
    catalogId: string;
    chartName: string;
};

export function getAreSameRestorableConfigRef(
    a: RestorableServiceConfigRef,
    b: RestorableServiceConfigRef
) {
    const keys = ["friendlyName", "catalogId", "chartName"] as const;

    assert<Equals<(typeof keys)[number], keyof RestorableServiceConfigRef>>;

    for (const key of keys) {
        const v_a = a[key];

        assert<Equals<typeof v_a, string>>();

        const v_b = b[key];

        if (v_a !== v_b) {
            return false;
        }
    }

    return true;
}
