import type { Meta, StoryObj } from "@storybook/react";
import { CustomDataGrid } from "./CustomDataGrid";
import { action } from "@storybook/addon-actions";
import { GridRowsProp, GridColDef } from "@mui/x-data-grid";

const meta = {
    title: "Pages/DataExplorer/CustomDataGrid",
    component: CustomDataGrid
} satisfies Meta<typeof CustomDataGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

const rows: GridRowsProp = [
    { id: 1, col1: "Hello", col2: "World", col3: "Foo", col4: "Bar", col5: "Baz" },
    {
        id: 2,
        col1: "DataGrid",
        col2: "is Awesome",
        col3: "React",
        col4: "MUI",
        col5: "Grid"
    },
    { id: 3, col1: "MUI", col2: "is great", col3: "JS", col4: "TS", col5: "Framework" }
];

const columns: GridColDef[] = [
    { field: "col1", headerName: "Column 1", width: 150 },
    { field: "col2", headerName: "Column 2", width: 150 },
    { field: "col3", headerName: "Column 3", width: 150 },
    { field: "col4", headerName: "Column 4", width: 150 },
    { field: "col5", headerName: "Column 5", width: 150 }
];

export const Default: Story = {
    args: {
        rows: rows,
        columns: columns,
        columnWidths: { col1: 150, col2: 150, col3: 150, col4: 150, col5: 150 },
        onColumnWidthChange: action("Column width changed")
    }
};
