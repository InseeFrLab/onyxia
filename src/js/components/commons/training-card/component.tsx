import { Training } from "js/model";
import {
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Grid,
    Avatar,
    Fab,
    Icon
} from "@mui/material";
import "./training-card.scss";
import { routes } from "ui/routes";

interface Props {
    training: Training;
}

const TrainingCard = ({ training }: Props) => {
    const {
        image,
        name,
        abstract,
        courseCode,
        coursePrerequisites,
        timeRequired,
        author,
        contributor,
        copyrightHolder,
        copyrightYear,
        inLanguage,
        learningResourceType,
        license,
        version,
        hasPart,
        deployment
    } = training;

    if (abstract === undefined) {
        throw new Error("Make it strict! Jo TODO");
    }

    const description = abstract.length > 100 ? `${abstract.slice(0, 100)}...` : abstract;
    const copyright = `${copyrightHolder}${copyrightYear ? ` - ${copyrightYear}` : ""}`;
    return (
        <Grid
            item
            lg={4}
            md={6}
            xs={12}
            classes={{ item: "carte" }}
            className="training-card"
        >
            <Card classes={{ root: "container" }}>
                <CardHeader
                    avatar={<Avatar src={image} />}
                    title={name}
                    subheader={`Version : ${version} / Langue : ${inLanguage}`}
                    classes={{
                        root: "en-tete",
                        avatar: "avatar",
                        title: "titre",
                        subheader: "sous-titre"
                    }}
                />
                <CardContent>
                    <div className="content">
                        <div className="body">
                            {learningResourceType && (
                                <div className="content-row">
                                    <span className="subtitle">Thème : </span>
                                    <span className="bubble-label">
                                        {learningResourceType}
                                    </span>
                                </div>
                            )}
                            {timeRequired && (
                                <div className="content-row">
                                    <span className="subtitle">Temps requis : </span>
                                    <span className="bubble-label time">
                                        {timeRequired}
                                    </span>
                                </div>
                            )}
                            <div className="description">Description</div>
                            <span>{description}</span>
                            {coursePrerequisites && (
                                <div className="content-row">
                                    <span className="subtitle">Pré-requis : </span>
                                    <span className="bubble-label prerequisites">
                                        {coursePrerequisites}
                                    </span>
                                </div>
                            )}
                            {author && (
                                <div className="content-row">
                                    <span className="subtitle">Auteur : </span>
                                    <span>{author}</span>
                                </div>
                            )}
                            {contributor && (
                                <div className="content-row">
                                    <span className="subtitle">Contributeur : </span>
                                    <span>{contributor}</span>
                                </div>
                            )}
                            {copyright && (
                                <div className="content-row">
                                    <span className="subtitle">Copyright : </span>
                                    <span className="bubble-label copyright">
                                        {copyright}
                                    </span>
                                </div>
                            )}
                            {license && (
                                <div className="content-row">
                                    <span className="subtitle">Licence : </span>
                                    <span className="bubble-label license">
                                        {license}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardActions className="boutons">
                    {hasPart && hasPart.length > 0 && (
                        <a {...(routes as any).trainings({ courseCode }).link}>
                            <Fab
                                id={`bouton-training-${name}`}
                                color="primary"
                                aria-label="Nouveau"
                            >
                                <Icon>more_horiz</Icon>
                            </Fab>
                        </a>
                    )}
                    {deployment && (
                        <a href={deployment}>
                            <Fab
                                id={`bouton-training-${name}`}
                                color="primary"
                                aria-label="Nouveau"
                            >
                                <Icon>settings_applications</Icon>
                            </Fab>
                        </a>
                    )}
                </CardActions>
            </Card>
        </Grid>
    );
};

export default TrainingCard;
