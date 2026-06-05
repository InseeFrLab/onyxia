import type { S3Uri } from "core/tools/S3Uri";
import type { CodeTextEditorLanguage } from "ui/shared/textEditor/CodeTextEditor";

export type ObjectRendering =
    | {
          renderAs: "dataset";
      }
    | {
          renderAs: "image";
          url: string;
      }
    | {
          renderAs: "video";
          url: string;
      }
    | {
          // Any non binary file should be rendered as code.
          renderAs: "code";
          language: CodeTextEditorLanguage | undefined;
          code: string;
      }
    | {
          renderAs: "download button";
          url: string;
      };

const maxCodeContentLength = 1_000_000;

const datasetExtensions = new Set([
    "csv",
    "tsv",
    "parquet",
    "pq",
    "json",
    "jsonl",
    "ndjson",
    "geojson",
    "topojson",
    "jsonld"
]);

const imageExtensions = new Set([
    "apng",
    "avif",
    "bmp",
    "gif",
    "ico",
    "jpeg",
    "jpg",
    "png",
    "svg",
    "webp"
]);

const imageMediaTypes = new Set([
    "image/apng",
    "image/avif",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/vnd.microsoft.icon",
    "image/webp",
    "image/x-icon"
]);

const videoExtensions = new Set(["m4v", "mov", "mp4", "ogv", "webm"]);

const videoMediaTypes = new Set([
    "application/ogg",
    "video/mp4",
    "video/ogg",
    "video/quicktime",
    "video/webm",
    "video/x-m4v"
]);

const codeTextEditorLanguageByExtension: Partial<Record<string, CodeTextEditorLanguage>> =
    {
        apl: "apl",
        asc: "asciiArmor",
        asn: "asn1",
        asn1: "asn1",
        bash: "shell",
        bf: "brainfuck",
        c: "c",
        cbl: "cobol",
        cc: "cpp",
        ceylon: "ceylon",
        cl: "commonLisp",
        clj: "clojure",
        cljc: "clojure",
        cljs: "clojure",
        cmake: "cmake",
        cob: "cobol",
        coffee: "coffeeScript",
        cpp: "cpp",
        cr: "crystal",
        cs: "csharp",
        css: "css",
        cts: "typescript",
        cxx: "cpp",
        d: "d",
        dart: "dart",
        diff: "diff",
        dtd: "dtd",
        dyl: "dylan",
        dylan: "dylan",
        ebnf: "ebnf",
        ecl: "ecl",
        edn: "clojure",
        e: "eiffel",
        elm: "elm",
        erl: "erlang",
        factor: "factor",
        fcl: "fcl",
        feature: "gherkin",
        fish: "shell",
        for: "fortran",
        forth: "forth",
        f: "fortran",
        f90: "fortran",
        f95: "fortran",
        fs: "fSharp",
        fsi: "fSharp",
        fsx: "fSharp",
        fth: "forth",
        go: "go",
        gql: "gql",
        gradle: "groovy",
        graphql: "gql",
        groovy: "groovy",
        gss: "gss",
        h: "c",
        hpp: "cpp",
        hrl: "erlang",
        hs: "haskell",
        htm: "html",
        html: "html",
        hxml: "hxml",
        hx: "haxe",
        hxx: "cpp",
        idl: "idl",
        java: "java",
        j2: "jinja2",
        jinja: "jinja2",
        jinja2: "jinja2",
        jl: "julia",
        js: "javascript",
        json: "JSON",
        jsonld: "jsonld",
        jsx: "javascript",
        kt: "kotlin",
        kts: "kotlin",
        less: "less",
        lhs: "haskell",
        lisp: "commonLisp",
        litcoffee: "coffeeScript",
        livescript: "liveScript",
        lsp: "commonLisp",
        ls: "liveScript",
        lua: "lua",
        mbox: "mbox",
        ml: "oCaml",
        mli: "oCaml",
        mm: "objectiveCpp",
        mo: "modelica",
        modelica: "modelica",
        msc: "mscgen",
        mscgen: "mscgen",
        mts: "typescript",
        m: "objectiveC",
        nc: "nesC",
        nsh: "nsis",
        nsi: "nsis",
        nt: "ntriples",
        ntriples: "ntriples",
        pas: "pascal",
        patch: "diff",
        pegjs: "pegjs",
        pgsql: "pgSQL",
        pig: "pig",
        pkb: "plSQL",
        pks: "plSQL",
        pl: "perl",
        pls: "plSQL",
        pm: "perl",
        pp: "puppet",
        properties: "properties",
        proto: "protobuf",
        ps1: "powerShell",
        psd1: "powerShell",
        psm1: "powerShell",
        pug: "pug",
        py: "python",
        pxd: "cython",
        pxi: "cython",
        pyw: "python",
        pyx: "cython",
        q: "q",
        r: "R",
        rb: "ruby",
        rbw: "ruby",
        rq: "sparql",
        rs: "rust",
        sass: "sass",
        sas: "sas",
        scala: "scala",
        sc: "scala",
        scm: "scheme",
        scss: "sCSS",
        sh: "shell",
        sig: "sml",
        sieve: "sieve",
        sml: "sml",
        sparql: "sparql",
        sql: "SQL",
        ss: "scheme",
        st: "smalltalk",
        styl: "stylus",
        stylus: "stylus",
        swift: "swift",
        tcl: "tcl",
        textile: "textile",
        tiki: "tiki",
        tlv: "tlv",
        toml: "toml",
        tr: "troff",
        ts: "typescript",
        tsx: "typescript",
        ttcn: "ttcn",
        ttcn3: "ttcn",
        ttl: "turtle",
        v: "verilog",
        vb: "vb",
        vbs: "vbScript",
        velocity: "velocity",
        vert: "shader",
        vh: "verilog",
        vhd: "vhdl",
        vhdl: "vhdl",
        wast: "wast",
        wat: "wast",
        webidl: "webIDL",
        wl: "mathematica",
        wls: "mathematica",
        xhtml: "html",
        xml: "xml",
        xq: "xQuery",
        xqm: "xQuery",
        xquery: "xQuery",
        xsl: "xml",
        xslt: "xml",
        yaml: "yaml",
        yml: "yaml",
        z80: "z80",
        zsh: "shell"
    };

const codeTextEditorLanguageByBasename: Partial<Record<string, CodeTextEditorLanguage>> =
    {
        ".bash_profile": "shell",
        ".bashrc": "shell",
        ".env": "properties",
        ".profile": "shell",
        ".zprofile": "shell",
        ".zshrc": "shell",
        "cmakelists.txt": "cmake",
        containerfile: "dockerFile",
        dockerfile: "dockerFile",
        gemfile: "ruby",
        "nginx.conf": "nginx",
        pipfile: "toml",
        procfile: "shell",
        rakefile: "ruby"
    };

const textExtensionsWithoutSpecificLanguage = [
    "adoc",
    "cfg",
    "cnf",
    "conf",
    "config",
    "crt",
    "csr",
    "editorconfig",
    "env",
    "gitignore",
    "key",
    "lock",
    "log",
    "markdown",
    "md",
    "mdx",
    "pem",
    "pub",
    "rst",
    "text",
    "txt"
];

const textExtensions = new Set([
    ...Object.keys(codeTextEditorLanguageByExtension),
    ...textExtensionsWithoutSpecificLanguage
]);

const textBasenames = new Set([
    ...Object.keys(codeTextEditorLanguageByBasename),
    ".dockerignore",
    ".eslintignore",
    ".gitignore",
    ".npmrc",
    ".prettierignore",
    ".yarnrc",
    "makefile",
    "readme"
]);

const codeTextEditorLanguageByMediaType: Partial<Record<string, CodeTextEditorLanguage>> =
    {
        "application/ecmascript": "javascript",
        "application/graphql": "gql",
        "application/javascript": "javascript",
        "application/json": "JSON",
        "application/ld+json": "jsonld",
        "application/sql": "SQL",
        "application/toml": "toml",
        "application/typescript": "typescript",
        "application/x-javascript": "javascript",
        "application/x-ndjson": "JSON",
        "application/x-sh": "shell",
        "application/x-shellscript": "shell",
        "application/x-toml": "toml",
        "application/x-typescript": "typescript",
        "application/x-yaml": "yaml",
        "application/xhtml+xml": "html",
        "application/xml": "xml",
        "application/yaml": "yaml",
        "text/css": "css",
        "text/html": "html",
        "text/javascript": "javascript",
        "text/x-python": "python",
        "text/xml": "xml",
        "text/yaml": "yaml"
    };

export async function getObjectRendering(params: {
    s3Uri: S3Uri;
    getDirectDownloadHttpUrl: () => Promise<string>;
}): Promise<ObjectRendering> {
    const { s3Uri, getDirectDownloadHttpUrl } = params;

    const url = await getDirectDownloadHttpUrl();
    const downloadButton = { renderAs: "download button", url } as const;

    const head = await fetchHead(url);

    if (head === undefined) {
        return downloadButton;
    }

    const basename = getBasename(s3Uri);
    const basename_lowercase = basename.toLowerCase();
    const extension = getExtension(basename);
    const mediaType = head.contentType;

    if (getIsDataset({ extension, mediaType })) {
        return { renderAs: "dataset" };
    }

    if (getIsImage({ extension, mediaType })) {
        return { renderAs: "image", url };
    }

    if (getIsVideo({ extension, mediaType })) {
        return { renderAs: "video", url };
    }

    if (
        !getIsTextualObject({
            basename_lowercase,
            extension,
            mediaType
        })
    ) {
        return downloadButton;
    }

    if (head.contentLength !== undefined && head.contentLength > maxCodeContentLength) {
        return downloadButton;
    }

    const code = await fetchText(url);

    if (code === undefined) {
        return downloadButton;
    }

    if (getIsProbablyBinary(code)) {
        return downloadButton;
    }

    return {
        renderAs: "code",
        language: getCodeTextEditorLanguage({
            basename_lowercase,
            extension,
            mediaType
        }),
        code
    };
}

async function fetchHead(
    url: string
): Promise<
    { contentType: string | undefined; contentLength: number | undefined } | undefined
> {
    let response: Response;

    try {
        response = await fetch(url, {
            method: "HEAD",
            redirect: "follow"
        });
    } catch {
        return undefined;
    }

    if (response.type === "opaque") {
        return undefined;
    }

    if (!response.ok) {
        return {
            contentType: undefined,
            contentLength: undefined
        };
    }

    return {
        contentType: getMediaType(response.headers.get("Content-Type")),
        contentLength: getContentLength(response.headers.get("Content-Length"))
    };
}

async function fetchText(url: string): Promise<string | undefined> {
    let response: Response;

    try {
        response = await fetch(url, { redirect: "follow" });
    } catch {
        return undefined;
    }

    if (!response.ok) {
        return undefined;
    }

    const mediaType = getMediaType(response.headers.get("Content-Type"));

    if (mediaType !== undefined && getIsKnownBinaryMediaType(mediaType)) {
        return undefined;
    }

    const contentLength = getContentLength(response.headers.get("Content-Length"));

    if (contentLength !== undefined && contentLength > maxCodeContentLength) {
        await response.body?.cancel().catch(() => {});
        return undefined;
    }

    try {
        return await response.text();
    } catch {
        return undefined;
    }
}

function getBasename(s3Uri: S3Uri): string {
    return s3Uri.keySegments.at(-1) ?? "";
}

function getExtension(basename: string): string | undefined {
    const dotIndex = basename.lastIndexOf(".");

    if (dotIndex <= 0 || dotIndex === basename.length - 1) {
        return undefined;
    }

    return basename.slice(dotIndex + 1).toLowerCase();
}

function getMediaType(contentType: string | null): string | undefined {
    if (contentType === null) {
        return undefined;
    }

    const mediaType = contentType.split(";")[0].trim().toLowerCase();

    return mediaType === "" ? undefined : mediaType;
}

function getContentLength(contentLength: string | null): number | undefined {
    if (contentLength === null) {
        return undefined;
    }

    const parsed = Number(contentLength);

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function getIsDataset(params: {
    extension: string | undefined;
    mediaType: string | undefined;
}) {
    const { extension, mediaType } = params;

    if (extension !== undefined && datasetExtensions.has(extension)) {
        return true;
    }

    if (mediaType === undefined) {
        return false;
    }

    return (
        mediaType === "application/csv" ||
        mediaType === "application/json" ||
        mediaType === "application/jsonl" ||
        mediaType === "application/geo+json" ||
        mediaType === "application/ld+json" ||
        mediaType === "application/ndjson" ||
        mediaType === "application/parquet" ||
        mediaType === "application/x-ndjson" ||
        mediaType === "application/x-parquet" ||
        mediaType === "text/csv" ||
        mediaType === "text/json" ||
        mediaType === "text/tab-separated-values" ||
        mediaType.endsWith("+json")
    );
}

function getIsImage(params: {
    extension: string | undefined;
    mediaType: string | undefined;
}) {
    const { extension, mediaType } = params;

    return (
        (extension !== undefined && imageExtensions.has(extension)) ||
        (mediaType !== undefined && imageMediaTypes.has(mediaType))
    );
}

function getIsVideo(params: {
    extension: string | undefined;
    mediaType: string | undefined;
}) {
    const { extension, mediaType } = params;

    return (
        (extension !== undefined && videoExtensions.has(extension)) ||
        (mediaType !== undefined && videoMediaTypes.has(mediaType))
    );
}

function getIsTextualObject(params: {
    basename_lowercase: string;
    extension: string | undefined;
    mediaType: string | undefined;
}) {
    const { basename_lowercase, extension, mediaType } = params;

    if (mediaType !== undefined && getIsKnownBinaryMediaType(mediaType)) {
        return false;
    }

    if (getCodeTextEditorLanguage(params) !== undefined) {
        return true;
    }

    if (
        basename_lowercase.startsWith(".env.") ||
        basename_lowercase.startsWith("dockerfile.") ||
        basename_lowercase.startsWith("containerfile.") ||
        textBasenames.has(basename_lowercase)
    ) {
        return true;
    }

    if (extension !== undefined && textExtensions.has(extension)) {
        return true;
    }

    return mediaType !== undefined && getIsTextualMediaType(mediaType);
}

function getCodeTextEditorLanguage(params: {
    basename_lowercase: string;
    extension: string | undefined;
    mediaType: string | undefined;
}): CodeTextEditorLanguage | undefined {
    const { basename_lowercase, extension, mediaType } = params;

    if (basename_lowercase.startsWith(".env.")) {
        return "properties";
    }

    if (basename_lowercase.startsWith("dockerfile.")) {
        return "dockerFile";
    }

    if (basename_lowercase.startsWith("containerfile.")) {
        return "dockerFile";
    }

    {
        const language = codeTextEditorLanguageByBasename[basename_lowercase];

        if (language !== undefined) {
            return language;
        }
    }

    if (extension !== undefined) {
        const language = codeTextEditorLanguageByExtension[extension];

        if (language !== undefined) {
            return language;
        }
    }

    if (mediaType !== undefined) {
        return codeTextEditorLanguageByMediaType[mediaType];
    }

    return undefined;
}

function getIsTextualMediaType(mediaType: string) {
    return (
        mediaType.startsWith("text/") ||
        mediaType.endsWith("+json") ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/ecmascript" ||
        mediaType === "application/graphql" ||
        mediaType === "application/javascript" ||
        mediaType === "application/json" ||
        mediaType === "application/ld+json" ||
        mediaType === "application/rtf" ||
        mediaType === "application/sql" ||
        mediaType === "application/toml" ||
        mediaType === "application/typescript" ||
        mediaType === "application/x-httpd-php" ||
        mediaType === "application/x-javascript" ||
        mediaType === "application/x-latex" ||
        mediaType === "application/x-ndjson" ||
        mediaType === "application/x-perl" ||
        mediaType === "application/x-python" ||
        mediaType === "application/x-sh" ||
        mediaType === "application/x-shellscript" ||
        mediaType === "application/x-tex" ||
        mediaType === "application/x-toml" ||
        mediaType === "application/x-typescript" ||
        mediaType === "application/x-yaml" ||
        mediaType === "application/xhtml+xml" ||
        mediaType === "application/xml" ||
        mediaType === "application/yaml"
    );
}

function getIsKnownBinaryMediaType(mediaType: string) {
    return (
        mediaType.startsWith("audio/") ||
        mediaType.startsWith("font/") ||
        mediaType.startsWith("image/") ||
        mediaType.startsWith("model/") ||
        mediaType.startsWith("video/") ||
        mediaType === "application/gzip" ||
        mediaType === "application/java-archive" ||
        mediaType === "application/pdf" ||
        mediaType === "application/vnd.rar" ||
        mediaType === "application/x-7z-compressed" ||
        mediaType === "application/x-bzip" ||
        mediaType === "application/x-bzip2" ||
        mediaType === "application/x-executable" ||
        mediaType === "application/x-gzip" ||
        mediaType === "application/x-rar-compressed" ||
        mediaType === "application/x-tar" ||
        mediaType === "application/zip" ||
        mediaType.endsWith("+zip")
    );
}

function getIsProbablyBinary(text: string) {
    const sample = text.slice(0, 4_096);

    if (sample.includes("\u0000")) {
        return true;
    }

    let controlCharacterCount = 0;

    for (let i = 0; i < sample.length; i++) {
        const charCode = sample.charCodeAt(i);

        if (
            charCode < 32 &&
            charCode !== 8 &&
            charCode !== 9 &&
            charCode !== 10 &&
            charCode !== 12 &&
            charCode !== 13
        ) {
            controlCharacterCount++;
        }
    }

    return sample.length !== 0 && controlCharacterCount / sample.length > 0.01;
}
