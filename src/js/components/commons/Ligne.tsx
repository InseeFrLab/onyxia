import { Button } from "@mui/material";
import type { IconTypeMap } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import Checkbox from "@mui/material/Checkbox";
import type { Link } from "type-route";

type Props = {
    linkProps: Link;
    name: string;
    icone: string;
    color?: IconTypeMap["props"]["color"];
    handleCheck?: (e: { target: { checked: boolean } }) => void;
    checked?: boolean;
    onClick?: () => void;
};

export const Ligne: React.FC<Props> = ({
    linkProps,
    name,
    icone,
    color = "secondary",
    handleCheck,
    checked,
    onClick
}) => (
    <>
        <div className="entry">
            <a {...linkProps}>
                <Button className="directory" onClick={onClick}>
                    {icone === "description" ? (
                        <DescriptionIcon fontSize="small" className="icone" color={color}>
                            description
                        </DescriptionIcon>
                    ) : (
                        <FolderIcon fontSize="small" className="icone" color={color}>
                            folder
                        </FolderIcon>
                    )}
                    <span className="texte">{name}</span>
                </Button>

                {checked !== undefined && handleCheck ? (
                    <Checkbox
                        checked={checked}
                        onChange={handleCheck}
                        className="select-it"
                    />
                ) : null}
            </a>
        </div>
    </>
);
