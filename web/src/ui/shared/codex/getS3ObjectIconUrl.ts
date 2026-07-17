import { PUBLIC_URL } from "env";

export type S3ObjectIconName =
    | "Code"
    | "Data"
    | "Image"
    | "Other"
    | "PDF"
    | "Sound"
    | "Video";

const iconNameByExtension: Readonly<Record<string, S3ObjectIconName>> = {
    // Data
    arrow: "Data",
    arff: "Data",
    avro: "Data",
    csv: "Data",
    db: "Data",
    dbf: "Data",
    dta: "Data",
    feather: "Data",
    geojson: "Data",
    h5: "Data",
    hdf: "Data",
    hdf5: "Data",
    json: "Data",
    jsonl: "Data",
    jsonld: "Data",
    ndjson: "Data",
    ods: "Data",
    orc: "Data",
    parquet: "Data",
    pq: "Data",
    sas7bdat: "Data",
    sav: "Data",
    sqlite: "Data",
    sqlite3: "Data",
    topojson: "Data",
    tsv: "Data",
    xls: "Data",
    xlsb: "Data",
    xlsm: "Data",
    xlsx: "Data",

    // Images
    apng: "Image",
    avif: "Image",
    bmp: "Image",
    gif: "Image",
    heic: "Image",
    heif: "Image",
    ico: "Image",
    jfif: "Image",
    jpeg: "Image",
    jpg: "Image",
    png: "Image",
    svg: "Image",
    tif: "Image",
    tiff: "Image",
    webp: "Image",

    // Audio
    aac: "Sound",
    aiff: "Sound",
    flac: "Sound",
    m4a: "Sound",
    mid: "Sound",
    midi: "Sound",
    mp3: "Sound",
    oga: "Sound",
    ogg: "Sound",
    opus: "Sound",
    wav: "Sound",
    weba: "Sound",
    wma: "Sound",

    // Video
    "3gp": "Video",
    avi: "Video",
    flv: "Video",
    m4v: "Video",
    mkv: "Video",
    mov: "Video",
    mp4: "Video",
    mpeg: "Video",
    mpg: "Video",
    ogv: "Video",
    webm: "Video",
    wmv: "Video",

    // PDF
    pdf: "PDF",

    // Code and configuration
    bash: "Code",
    c: "Code",
    cc: "Code",
    cjs: "Code",
    clj: "Code",
    cljs: "Code",
    cmake: "Code",
    cob: "Code",
    cpp: "Code",
    cs: "Code",
    css: "Code",
    cts: "Code",
    cxx: "Code",
    dart: "Code",
    diff: "Code",
    dockerfile: "Code",
    elm: "Code",
    erl: "Code",
    ex: "Code",
    exs: "Code",
    f: "Code",
    f90: "Code",
    f95: "Code",
    fish: "Code",
    fs: "Code",
    fsx: "Code",
    go: "Code",
    gql: "Code",
    gradle: "Code",
    graphql: "Code",
    groovy: "Code",
    h: "Code",
    hpp: "Code",
    hs: "Code",
    htm: "Code",
    html: "Code",
    hxx: "Code",
    ini: "Code",
    ipynb: "Code",
    java: "Code",
    jl: "Code",
    js: "Code",
    jsx: "Code",
    kt: "Code",
    kts: "Code",
    less: "Code",
    lisp: "Code",
    lua: "Code",
    m: "Code",
    makefile: "Code",
    mjs: "Code",
    ml: "Code",
    mli: "Code",
    mm: "Code",
    mts: "Code",
    pas: "Code",
    patch: "Code",
    php: "Code",
    pl: "Code",
    pm: "Code",
    properties: "Code",
    proto: "Code",
    ps1: "Code",
    py: "Code",
    pyw: "Code",
    r: "Code",
    rb: "Code",
    rs: "Code",
    sass: "Code",
    scala: "Code",
    scm: "Code",
    scss: "Code",
    sh: "Code",
    sql: "Code",
    swift: "Code",
    tcl: "Code",
    toml: "Code",
    ts: "Code",
    tsx: "Code",
    v: "Code",
    vb: "Code",
    vbs: "Code",
    vue: "Code",
    wasm: "Code",
    wat: "Code",
    xml: "Code",
    xsl: "Code",
    xslt: "Code",
    yaml: "Code",
    yml: "Code",
    zig: "Code",
    zsh: "Code"
};

export function getS3ObjectIconName(objectBasename: string): S3ObjectIconName {
    const extensionStartIndex = objectBasename.lastIndexOf(".");

    if (extensionStartIndex <= 0 || extensionStartIndex === objectBasename.length - 1) {
        return "Other";
    }

    const extension = objectBasename.slice(extensionStartIndex + 1).toLowerCase();

    return iconNameByExtension[extension] ?? "Other";
}

export function getS3ObjectIconUrl(objectBasename: string): string {
    return `${PUBLIC_URL}/icons/explorer/${getS3ObjectIconName(objectBasename)}.svg`;
}
