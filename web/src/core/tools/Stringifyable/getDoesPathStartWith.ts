export function getDoesPathStartWith(params: {
    shorterPath: (string | number)[];
    longerPath: (string | number)[];
}) {
    const { shorterPath, longerPath } = params;

    for (let i = 0; i < shorterPath.length; i++) {
        if (shorterPath[i] !== longerPath[i]) {
            return false;
        }
    }

    return true;
}
