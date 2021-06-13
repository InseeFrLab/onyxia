
import axios from "axios";
import { assert } from "tsafe/assert";

//NOTE: Used this service: https://helloacm.com/tools/can-visit/ 
//Got the hash from the page's source. Without it it doesn't work.

/* spell-checker: disable */
const servers = [
    "helloacm.com",
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
];
/* spell-checker: enable */

export async function getUrlHttpStatusCode(
    params: { url: string }
): Promise<number> {

    const { url } = params;

    const server = servers[Math.floor(Math.random() * servers.length)];

    let statusCode: number | undefined = undefined;

    try {

        statusCode = await axios.create().get<{ code: number; }>(
            `https://${server}/api/can-visit/?url=${encodeURIComponent(url)}`,
            {
                "params": {
                    "hash": "4ccb730dba9867ca803189738ec2280c"
                        .split('').reverse().join('')
                }
            }
        ).then(({ data }) => data.code);

        assert(typeof statusCode === "number", "statusCode wasn't a number");

    } catch (error) {

        error.message += ` Used server ${server}`;

        throw error;

    }

    return statusCode;

}