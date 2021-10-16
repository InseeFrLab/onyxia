import {
    Paper,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import Titre from "js/components/commons/titre";
import CopyableField from "js/components/commons/copyable-field";

interface Props {
    env: object;
    urls?: string[];
    internalUrls?: string[];
    message?: string;
}

const ListUrls = ({ urls, external }: { urls: string[]; external: boolean }) => (
    <>
        {urls.map(url => (
            <CopyableField copy value={url} open={external} />
        ))}
    </>
);

const ServiceEnv = ({ env, message, urls = [], internalUrls = [] }: Props) => {
    const nbUrls = urls.length + internalUrls.length;
    return (
        <Paper className="paragraphe" elevation={1}>
            {message && <Typography gutterBottom>{message}</Typography>}

            {nbUrls > 0 && (
                <>
                    <Typography variant="h3" gutterBottom>
                        <Titre titre="	Accéder à votre service" wait={false} />
                    </Typography>

                    <ListUrls urls={urls} external={true} />

                    <ListUrls urls={internalUrls} external={false} />
                </>
            )}

            <Typography variant="h3" gutterBottom>
                <Titre titre="	Configuration du service" wait={false} />
            </Typography>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Propriété</TableCell>
                        <TableCell>Valeur</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(env).map(([key, value], i) => (
                        <TableRow key={i}>
                            <TableCell>{key}</TableCell>
                            <TableCell>
                                <CopyableField copy value={value} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
};

export default ServiceEnv;
