import Typography from "@mui/material/Typography";
import { connect } from "react-redux";
import { actions } from "js/redux/legacyActions";
import VisiteGuide from "./visite-guidee.component";
import { Next, LinkTo, Arrow } from "./vignette-commons";
import D from "js/i18n";
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
import { routes } from "ui/routes";
//import { createGroup } from "type-route";
const { startVisite } = actions;

const ETAPES = [
    {
        description: () => (
            <>
                <Typography variant="h6" gutterBottom>
                    {D.guidedTourWelcomeTitle}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    {D.guidedTourWelcomeText1}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    {D.guidedTourWelcomeText2}
                </Typography>
            </>
        ),
        actions: ({ next }: { next: any }) => <Next next={next} />
    },
    {
        description: () => {
            const bouton = document.getElementById("bouton-mon-compte");
            return (
                <>
                    <Arrow dom={bouton} />
                    <Typography variant="h6" gutterBottom>
                        {D.guidedTourAuthenticationTitle}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {D.guidedTourAuthenticationText1}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {D.guidedTourAuthenticationText2}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {D.guidedTourAuthenticationText3}
                    </Typography>
                </>
            );
        },
        actions: ({ startVisite }: { startVisite: any }) => (
            <LinkTo
                anchorProps={routes.myServices().link}
                onClick={startVisite}
                type="home"
            />
        )
    }
];

const VisiteConnected: any = connect(undefined, {
    "startVisite": () => startVisite()
})(props => (
    <LegacyThemeProvider>
        <VisiteGuide visite={true} etapes={ETAPES} {...(props as any)} />
    </LegacyThemeProvider>
));

//VisiteGuideeDebut.routeGroup = createGroup([routes.tour]);

VisiteGuideeDebut.getDoRequireUserLoggedIn = true;

export function VisiteGuideeDebut() {
    return <VisiteConnected />;
}
