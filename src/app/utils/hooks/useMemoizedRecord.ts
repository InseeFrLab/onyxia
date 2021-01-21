
import { useRef } from "react";

function getIsUpdated(
    previousRecord: Record<string, unknown> | undefined,
    record: Record<string, unknown>
) {

    if (previousRecord === undefined) {
        return true;
    }

    if( previousRecord === record ){
        return false;
    }

    const keys = Object.keys(record);

    for (const key of keys) {

        if (record[key] !== previousRecord[key]) {

            console.log(key);

            return true;
        }

    }

    if (Object.keys(previousRecord).length !== keys.length) {
        return true;
    }

    return false;

}

export function useMemoizedRecord<R extends Record<string, unknown>>(record: R): R {

    const previousRecordRef = useRef<typeof record | undefined>(undefined);

    const isUpdated = getIsUpdated(previousRecordRef.current, record);

    const memoizedRecord = isUpdated ? record : previousRecordRef.current!;

    if( isUpdated ){

        previousRecordRef.current = record;

    }

    return memoizedRecord;

}
