
import axios from "axios";
import { assert } from "tsafe/assert";

//NOTE: Used this service: https://helloacm.com/tools/can-visit/ 
//Got the hash from the page's source. Without it it doesn't work.

/* spell-checker: disable */
/*
Other server to choose from
    "happyukgo.com",
    "uploadbeta.com",
    "steakovercooked.com",
    "anothervps.com",
    "rot47.net",
    "isvbscriptdead.com",
    "weibomiaopai.com",
    "zhihua-lai.com",
    "steemyy.com",
    "propagationtools.com", 
    "slowapi.com"
*/
const server = "helloacm.com";
/* spell-checker: enable */

export async function getUrlHttpStatusCode(
    params: { url: string }
): Promise<number> {

    const { url } = params;

    const { code } = await axios.create().get<{ code: number; }>(
        `https://${server}/api/can-visit/?url=${encodeURIComponent(url)}`,
        {
            "params": {
                "hash": "4ccb730dba9867ca803189738ec2280c"
                    .split('').reverse().join('')
            }
        }
    ).then(({ data }) => data);

    assert(typeof code === "number");

    return code;

}