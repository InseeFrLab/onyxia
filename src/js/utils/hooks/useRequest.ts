import { useState, useCallback, useEffect, useMemo } from "react";
import * as runExclusive from "run-exclusive";

/** 
 * Returns [ isRequestPending, makeRequestProxy, [<lastRequestResult>?] ] 
 * 
 * Take a function that takes some time to complete
 * and return a function that return void instead of Promise<U>
 * alongside a boolean value that is true while there is a request
 * currently being performed.
 * 
 * Calls are queued, only one instance of the request can be running
 * simultaneously.
 * 
 * This hooks does not handle errors.
 * Makes sure mareRequest never rejects.
 * 
 **/
export function useRequest<T extends any[], U>(
  makeRequest: (...args: T)=> Promise<U>
): [
  boolean,
  (...args: T)=> void,
  [U] | []
] {

  const [ isRequestPending, setIsRequestPending ]= useState(false);
  const [ dataWrap, setDataWrap ]= useState<[U]|[]>([]);

  const [ args, setArgs ] = useState<T | undefined>(undefined);

  const runExclusiveMakeRequest = useMemo(
    //NOTE: TypeScript why would you betray me like that? This should be inferable.
    () => runExclusive.build(makeRequest as any) as typeof makeRequest,
    [makeRequest]
  );

  useEffect(() => {

    if (args === undefined) {
      return;
    }

    let ignore = false;

    (async () => {

      setIsRequestPending(true);

      const data = await runExclusiveMakeRequest(...args);

      if (ignore) {
        return;
      }

      setIsRequestPending(runExclusive.isRunning(runExclusiveMakeRequest));

      setDataWrap([data]);

    })();

    return () => { ignore = true; };

  }, [args, runExclusiveMakeRequest]);

  return [
    isRequestPending,
    useCallback(
      (...args: T) => { setArgs(args); },
      []
    ),
    dataWrap
  ];

}