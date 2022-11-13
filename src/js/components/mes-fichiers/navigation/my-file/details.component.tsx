import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Typography, Paper } from "@mui/material";

const Details: React.FC<{ file: any; statusPolicy?: string }> = ({
    file,
    statusPolicy
}) => (
    <Paper className="paragraphe" elevation={1}>
        <Typography variant="h3" gutterBottom>
            Caractéristiques
        </Typography>
        <Typography variant="body1" gutterBottom>
            nom : {file.name}
        </Typography>
        <Typography variant="body1" gutterBottom>
            taille : {getSizeLabel(file.size)}
        </Typography>
        <Typography variant="body1" gutterBottom>
            date de dernière modification : {formatageDate(file.lastModified)}
        </Typography>
        {statusPolicy ? (
            <Typography variant="body1" gutterBottom>
                Votre fichier est dans un répertoire public. Il est donc accéssible pour
                tous.
            </Typography>
        ) : null}
    </Paper>
);

const getSizeLabel = (size: number) =>
    size > 1000000000
        ? `${(size / Math.pow(1024, 3)).toFixed(2)} go`
        : size > 1000000
        ? `${Math.round(size / Math.pow(1024, 2)).toFixed(2)} mo`
        : `${Math.round(size / 1024).toFixed(2)} ko`;

/* */
const formatageDate = (date: string) => dayjs(date).format("DD/MM/YYYY");

Details.propTypes = {
    file: PropTypes.shape({
        name: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,
        lastModified: PropTypes.instanceOf(Date).isRequired
    }).isRequired
};

export default Details;
