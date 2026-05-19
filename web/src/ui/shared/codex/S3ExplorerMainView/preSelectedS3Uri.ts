import type { S3Uri } from "core/tools/S3Uri";
import { Evt } from "evt";

export const evtS3Uri_preSelected = Evt.create<
    S3Uri.NonTerminatedByDelimiter | undefined
>(undefined);

export function setPreSelectedS3Uri(params: { s3Uri: S3Uri.NonTerminatedByDelimiter }) {
    const { s3Uri } = params;
    evtS3Uri_preSelected.state = s3Uri;
}
