import audioSvgUrl from "ui/assets/svg/explorer/audio.svg";
import cssSvgUrl from "ui/assets/svg/explorer/css.svg";
import csvSvgUrl from "ui/assets/svg/explorer/csv.svg";
import dataSvgUrl from "ui/assets/svg/explorer/data.svg";
import directorySvgUrl from "ui/assets/svg/explorer/directory.svg";
import htmlSvgUrl from "ui/assets/svg/explorer/html.svg";
import imageSvgUrl from "ui/assets/svg/explorer/image.svg";
import illustratorSvgUrl from "ui/assets/svg/explorer/illustrator.svg";
import javaSvgUrl from "ui/assets/svg/explorer/java.svg";
import javascriptSvgUrl from "ui/assets/svg/explorer/javascript.svg";
import jsonSvgUrl from "ui/assets/svg/explorer/json.svg";
import luaSvgUrl from "ui/assets/svg/explorer/lua.svg";
import markdownSvgUrl from "ui/assets/svg/explorer/markdown.svg";
import pdfSvgUrl from "ui/assets/svg/explorer/pdf.svg";
import photoshopSvgUrl from "ui/assets/svg/explorer/photoshop.svg";
import phpSvgUrl from "ui/assets/svg/explorer/php.svg";
import githubSvgUrl from "ui/assets/svg/explorer/github.svg";
import configSvgUrl from "ui/assets/svg/explorer/config.svg";
import pythonSvgUrl from "ui/assets/svg/explorer/python.svg";
import reactSvgUrl from "ui/assets/svg/explorer/react.svg";
import rustSvgUrl from "ui/assets/svg/explorer/rust.svg";
import sassSvgUrl from "ui/assets/svg/explorer/sass.svg";
import scalaSvgUrl from "ui/assets/svg/explorer/scala.svg";
import svgSvgUrl from "ui/assets/svg/explorer/svg.svg";
import texSvgUrl from "ui/assets/svg/explorer/tex.svg";
import typescriptSvgUrl from "ui/assets/svg/explorer/typescript.svg";
import videoSvgUrl from "ui/assets/svg/explorer/video.svg";
import vueSvgUrl from "ui/assets/svg/explorer/vue.svg";
import wordSvgUrl from "ui/assets/svg/explorer/word.svg";
import xmlSvgUrl from "ui/assets/svg/explorer/xml.svg";
import xlsSvgUrl from "ui/assets/svg/explorer/xls.svg";
import ymlSvgUrl from "ui/assets/svg/explorer/yml.svg";
import zipSvgUrl from "ui/assets/svg/explorer/zip.svg";
import RSvgUrl from "ui/assets/svg/explorer/R.svg";
import faviconSvgUrl from "ui/assets/svg/explorer/favicon.svg";
import goSvgUrl from "ui/assets/svg/explorer/go.svg";
import textSvgUrl from "ui/assets/svg/explorer/text.svg";

// Mapping des extensions et des icônes
export const fileTypeIcons = {
    directory: directorySvgUrl,

    // Audio
    mp3: audioSvgUrl,
    wav: audioSvgUrl,
    flac: audioSvgUrl,
    ogg: audioSvgUrl,

    // CSS
    css: cssSvgUrl,

    // CSV
    csv: csvSvgUrl,

    //Text
    txt: textSvgUrl,

    //Git
    gitignore: githubSvgUrl,
    gitkeep: githubSvgUrl,
    gitattributes: githubSvgUrl,

    // Config
    env: configSvgUrl,
    config: configSvgUrl,

    // Data (general files without specific extensions)
    data: dataSvgUrl,
    json: jsonSvgUrl,
    yaml: ymlSvgUrl,
    yml: ymlSvgUrl,

    // HTML
    html: htmlSvgUrl,

    // Images
    png: imageSvgUrl,
    jpg: imageSvgUrl,
    jpeg: imageSvgUrl,
    gif: imageSvgUrl,
    svg: svgSvgUrl,
    ai: illustratorSvgUrl, // Adobe Illustrator
    psd: photoshopSvgUrl, // Photoshop
    ico: faviconSvgUrl,

    // JavaScript & TypeScript
    js: javascriptSvgUrl,
    jsx: reactSvgUrl,
    ts: typescriptSvgUrl,
    tsx: reactSvgUrl,
    lua: luaSvgUrl,
    java: javaSvgUrl,
    py: pythonSvgUrl,
    php: phpSvgUrl,
    r: RSvgUrl,
    go: goSvgUrl,
    md: markdownSvgUrl,

    pdf: pdfSvgUrl,

    rs: rustSvgUrl,
    scala: scalaSvgUrl,

    scss: sassSvgUrl,
    sass: sassSvgUrl,

    tex: texSvgUrl,

    mp4: videoSvgUrl,
    mov: videoSvgUrl,
    avi: videoSvgUrl,

    vue: vueSvgUrl,

    xml: xmlSvgUrl,

    xls: xlsSvgUrl,
    xlsx: xlsSvgUrl,

    doc: wordSvgUrl,
    docx: wordSvgUrl,

    zip: zipSvgUrl,
    rar: zipSvgUrl,
    tar: zipSvgUrl,
    gz: zipSvgUrl
} as const;

// Extraire dynamiquement les clés
export const supportedIconsIds = Object.keys(
    fileTypeIcons
) as (keyof typeof fileTypeIcons)[];

export type SupportedIconsIds = (typeof supportedIconsIds)[number];

export function getIconIdFromExtension(extension: string | undefined): SupportedIconsIds {
    const ext = (extension ?? "").toLowerCase();

    if (ext in fileTypeIcons) {
        return ext as SupportedIconsIds;
    }

    return "data";
}
