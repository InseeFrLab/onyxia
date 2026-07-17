import { describe, expect, it } from "vitest";
import { getS3ObjectIconName } from "./getS3ObjectIconUrl";

describe(getS3ObjectIconName.name, () => {
    it.each([
        ["analysis.csv", "Data"],
        ["events.parquet", "Data"],
        ["records.jsonl", "Data"],
        ["photo.jpeg", "Image"],
        ["diagram.SVG", "Image"],
        ["podcast.mp3", "Sound"],
        ["recording.wav", "Sound"],
        ["demo.mp4", "Video"],
        ["clip.webm", "Video"],
        ["report.pdf", "PDF"],
        ["component.tsx", "Code"],
        ["pipeline.py", "Code"]
    ] as const)("maps %s to the %s icon", (objectBasename, expectedIconName) => {
        expect(getS3ObjectIconName(objectBasename)).toBe(expectedIconName);
    });

    it.each(["README", ".env", "archive.zip", "file."])(
        "uses the fallback icon for %s",
        objectBasename => {
            expect(getS3ObjectIconName(objectBasename)).toBe("Other");
        }
    );
});
