import fs from "fs";
import { mkdir, rm } from "fs/promises";
import path from "path";
import https from "https";

const DUCKDB_ENGINE_VERSION = "v1.4.3";

const DEFAULT_EXTS = ["parquet", "json", "httpfs", "iceberg", "avro"];

const OUTPUT_DIR = path.join(
    process.cwd(),
    "public",
    "duckdb-extensions",
    DUCKDB_ENGINE_VERSION,
    "wasm_eh"
);

const BASE_URL = `https://extensions.duckdb.org/${DUCKDB_ENGINE_VERSION}/wasm_eh`;

console.log("🧭 Updating DuckDB WASM extensions");
console.log(`   Using DuckDB engine version: ${DUCKDB_ENGINE_VERSION}`);

async function download(url: string, dest: string) {
    return new Promise<void>((resolve, reject) => {
        https
            .get(url, res => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to download ${url} (${res.statusCode})`));
                    return;
                }

                const writable = fs.createWriteStream(dest);
                res.pipe(writable);

                writable.on("finish", () => resolve());
                writable.on("error", reject);
            })
            .on("error", reject);
    });
}

async function main() {
    try {
        console.log("🧹 Cleaning old extensions...");
        await rm(OUTPUT_DIR, { recursive: true, force: true });
        await mkdir(OUTPUT_DIR, { recursive: true });

        for (const ext of DEFAULT_EXTS) {
            const fileName = `${ext}.duckdb_extension.wasm`;
            const url = `${BASE_URL}/${fileName}`;
            const dest = path.join(OUTPUT_DIR, fileName);

            console.log(`⬇️  Downloading ${ext} extension...`);
            await download(url, dest);
            console.log(`   ✅ Saved to ${dest}`);
        }

        console.log("🎉 All extensions updated successfully!");
    } catch (error) {
        console.error("❌ Update failed:", (error as Error).message);
        process.exit(1);
    }
}

main();
