import * as fs from "fs";
import { assert } from "tsafe/assert";

export function replaceInFile(
	params: {
		filePath: string;
		replacedStr: string;
		replacingStr: string;
		/** Default false */
		doEnableMultipleOccurrenceToBePresentAndOnlyReplaceTheFirstOnce?: boolean;
	}
) {

	const { filePath, replacedStr, replacingStr, doEnableMultipleOccurrenceToBePresentAndOnlyReplaceTheFirstOnce = false } = params;

	const rawYaml = fs.readFileSync(filePath).toString("utf8");

	if (!doEnableMultipleOccurrenceToBePresentAndOnlyReplaceTheFirstOnce) {

		assert(
			countOccurrences({ "str": rawYaml, "searchString": replacedStr }) === 1,
			[
				`Abort updating ${filePath} because "${replacedStr}" is present more than once`,
				`ask u/garronej to update this action`
			].join(" ")
		);

	}

	fs.writeFileSync(
		filePath,
		Buffer.from(
			rawYaml.replace(
				replacedStr,
				replacingStr
			),
			"utf8"
		)
	);

}

function countOccurrences(
	params: {
		str: string;
		searchString: string;
	}
) {
	const { str, searchString } = params;
	return str.split(searchString).length - 1;
}