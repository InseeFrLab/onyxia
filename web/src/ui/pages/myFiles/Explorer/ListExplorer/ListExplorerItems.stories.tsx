import type { Meta, StoryObj } from "@storybook/react";
import { ListExplorerItems } from "./ListExplorerItems";
import { action } from "@storybook/addon-actions";
import { Evt } from "evt";
import type { Item } from "../../shared/types";

const meta = {
    title: "Pages/MyFiles/Explorer/ListExplorerItems",
    component: ListExplorerItems
} satisfies Meta<typeof ListExplorerItems>;

export default meta;

type Story = StoryObj<typeof meta>;

const itemsSample: Item[] = [
    {
        kind: "file",
        basename: "document.pdf",
        size: 1024000, // en bytes
        lastModified: new Date("2023-10-01"),
        policy: "private",
        canChangePolicy: true,

        isBeingDeleted: false,
        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "photo.png",
        size: 2048000, // en bytes
        lastModified: new Date("2023-09-15"),
        policy: "public",
        isBeingDeleted: false,
        isPolicyChanging: false,
        canChangePolicy: false,
        isBeingCreated: true,
        uploadPercent: 75 // Example upload percentage
    },
    {
        kind: "directory",
        basename: "Projects",
        policy: "private",
        isBeingDeleted: false,
        isPolicyChanging: true,
        isBeingCreated: false,
        canChangePolicy: true
    },
    {
        kind: "file",
        basename: "presentation.pptx",
        size: 5120000, // en bytes
        lastModified: new Date("2023-09-20"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "directory",
        basename: "Photos",
        policy: "public",
        canChangePolicy: true,

        isBeingDeleted: false,
        isPolicyChanging: false,
        isBeingCreated: false
    }
];

export const Default: Story = {
    args: {
        isNavigating: false,
        items: itemsSample,
        isBucketPolicyFeatureEnabled: true,
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItems: action("Delete items"),
        onPolicyChange: action("Policy change"),
        onCopyPath: action("Copy path"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        onDownloadItems: action("Download Items"),
        evtAction: Evt.create<
            | "DELETE SELECTED ITEM"
            | "COPY SELECTED ITEM PATH"
            | "SHARE SELECTED FILE"
            | "DOWNLOAD DIRECTORY"
        >(),
        onShare: action("Share file")
    }
};

const itemsIcons: Item[] = [
    // Directory
    {
        kind: "directory",
        basename: "Documents",
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Archives
    {
        kind: "file",
        basename: "archive.zip",
        size: 10485760,
        lastModified: new Date("2023-02-04"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    // Audio
    {
        kind: "file",
        basename: "track.mp3",
        size: 1024000,
        lastModified: new Date("2023-01-01"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "audio.wav",
        size: 2048000,
        lastModified: new Date("2023-01-02"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "music.flac",
        size: 3072000,
        lastModified: new Date("2023-01-03"),
        policy: "private",
        isBeingDeleted: false,
        isPolicyChanging: false,
        canChangePolicy: true,

        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "song.ogg",
        size: 4096000,
        lastModified: new Date("2023-01-04"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: false,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // CSS
    {
        kind: "file",
        basename: "styles.css",
        size: 102400,
        lastModified: new Date("2023-01-05"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // CSV
    {
        kind: "file",
        basename: "data.csv",
        size: 204800,
        lastModified: new Date("2023-01-06"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Text
    {
        kind: "file",
        basename: "notes.txt",
        size: 51200,
        lastModified: new Date("2023-01-07"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Git
    {
        kind: "file",
        basename: ".gitignore",
        size: 1024,
        lastModified: new Date("2023-01-08"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: ".gitattributes",
        size: 2048,
        lastModified: new Date("2023-01-09"),
        policy: "private",
        isBeingDeleted: false,
        isPolicyChanging: false,
        canChangePolicy: true,

        isBeingCreated: false
    },

    // Config
    {
        kind: "file",
        basename: ".env",
        size: 1024,
        lastModified: new Date("2023-01-10"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Data
    {
        kind: "file",
        basename: "database.json",
        size: 204800,
        lastModified: new Date("2023-01-11"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "structure.yaml",
        size: 256000,
        lastModified: new Date("2023-01-12"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // HTML
    {
        kind: "file",
        basename: "index.html",
        size: 102400,
        lastModified: new Date("2023-01-13"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Images
    {
        kind: "file",
        basename: "logo.png",
        size: 51200,
        lastModified: new Date("2023-01-14"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "banner.jpg",
        size: 128000,
        lastModified: new Date("2023-01-15"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "graphic.psd",
        size: 1024000,
        lastModified: new Date("2023-01-16"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "design.ai",
        size: 2048000,
        lastModified: new Date("2023-01-17"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "favicon.ico",
        size: 10240,
        lastModified: new Date("2023-01-18"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // JavaScript & TypeScript
    {
        kind: "file",
        basename: "app.jsx",
        size: 102400,
        lastModified: new Date("2023-01-19"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "component.tsx",
        size: 204800,
        lastModified: new Date("2023-01-20"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Java
    {
        kind: "file",
        basename: "Main.java",
        size: 512000,
        lastModified: new Date("2023-01-21"),
        policy: "private",
        isBeingDeleted: false,
        isPolicyChanging: false,
        canChangePolicy: true,

        isBeingCreated: false
    },

    // Go
    {
        kind: "file",
        basename: "main.go",
        size: 384000,
        lastModified: new Date("2023-01-25"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Python
    {
        kind: "file",
        basename: "script.py",
        size: 102400,
        lastModified: new Date("2023-01-22"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // PHP
    {
        kind: "file",
        basename: "index.php",
        size: 204800,
        lastModified: new Date("2023-01-23"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // R
    {
        kind: "file",
        basename: "analysis.R",
        size: 256000,
        lastModified: new Date("2023-01-24"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Markdown
    {
        kind: "file",
        basename: "readme.md",
        size: 51200,
        lastModified: new Date("2023-01-26"),
        policy: "public",
        isBeingDeleted: false,
        isPolicyChanging: false,
        canChangePolicy: true,

        isBeingCreated: false
    },

    // Scala
    {
        kind: "file",
        basename: "project.scala",
        size: 64000,
        lastModified: new Date("2023-01-27"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // SCSS
    {
        kind: "file",
        basename: "theme.scss",
        size: 128000,
        lastModified: new Date("2023-01-28"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // LaTeX
    {
        kind: "file",
        basename: "paper.tex",
        size: 96000,
        lastModified: new Date("2023-01-29"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Video
    {
        kind: "file",
        basename: "movie.mp4",
        size: 10485760,
        lastModified: new Date("2023-01-30"),
        policy: "public",
        isBeingDeleted: false,
        isPolicyChanging: false,
        canChangePolicy: true,

        isBeingCreated: false
    },

    // Vue.js
    {
        kind: "file",
        basename: "frontend.vue",
        size: 51200,
        lastModified: new Date("2023-01-31"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // XML
    {
        kind: "file",
        basename: "config.xml",
        size: 25600,
        lastModified: new Date("2023-02-01"),
        policy: "public",
        isBeingDeleted: false,
        isPolicyChanging: false,
        canChangePolicy: true,

        isBeingCreated: false
    },

    // Excel
    {
        kind: "file",
        basename: "data.xlsx",
        size: 512000,
        lastModified: new Date("2023-02-02"),
        policy: "private",
        isBeingDeleted: false,
        canChangePolicy: true,

        isPolicyChanging: false,
        isBeingCreated: false
    },

    // Word
    {
        kind: "file",
        basename: "report.docx",
        size: 1024000,
        lastModified: new Date("2023-02-03"),
        policy: "public",
        isBeingDeleted: false,
        canChangePolicy: true,
        isPolicyChanging: false,
        isBeingCreated: false
    }
];

export const IconsSupported: Story = {
    args: {
        isNavigating: false,
        items: itemsIcons,
        isBucketPolicyFeatureEnabled: true,
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItems: action("Delete items"),
        onPolicyChange: action("Policy change"),
        onCopyPath: action("Copy path"),
        onDownloadItems: action("Download Items"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        evtAction: Evt.create<
            | "DELETE SELECTED ITEM"
            | "COPY SELECTED ITEM PATH"
            | "SHARE SELECTED FILE"
            | "DOWNLOAD DIRECTORY"
        >(),
        onShare: action("Share file")
    }
};
