import * as D from "./dictionary";
import createDictionary from "./build-dictionary";

const dictionary = Object.values(D).reduce((acc, dict) => ({ ...acc, ...dict }), {});

export default createDictionary(dictionary);
