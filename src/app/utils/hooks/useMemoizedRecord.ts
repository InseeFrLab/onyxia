
import { useRef } from "react";

function getIsUpdated(
    previousRecord: Record<string, unknown> | undefined,
    record: Record<string, unknown>
) {

    if (previousRecord === undefined) {
        return true;
    }

    const keys = Object.keys(record);

    for (const key of keys) {

        if (record[key] !== previousRecord[key]) {
            return true;
        }

    }

    if (Object.keys(previousRecord).length !== keys.length) {
        return true;
    }

    return false;

}

/** Grantee to always return a new ref if not shallow equal at level 1 */
export function useMemoizedRecord<R extends Record<string, unknown>>(record: R): R {

    const previousRecordRef = useRef<typeof record | undefined>(undefined);

    const isUpdated = getIsUpdated(previousRecordRef.current, record);

    const memoizedRecord = isUpdated ?
        previousRecordRef.current !== record ? record : { ...record }
        :
        previousRecordRef.current!;

    if (isUpdated) {

        previousRecordRef.current = record;

    }

    return memoizedRecord;

}
