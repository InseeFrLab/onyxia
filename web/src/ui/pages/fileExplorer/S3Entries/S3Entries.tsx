import Grid from "@mui/material/Grid2";
import { S3EntryCard } from "./S3EntryCard";

export function S3Entries() {
    return (
        <Grid container spacing={2}>
            {[
                {
                    id: "1",
                    title: "Mes données",
                    description: "Vos propres fichiers et jeux de données.",
                    path: "user",
                    type: "personal" as const
                },
                {
                    id: "2",
                    title: "Projet X",
                    description: "Sources de données partagées pour l'équipe X.",
                    path: "projet-x",
                    type: "group" as const
                },
                {
                    id: "3",
                    title: "Catalogue Insee",
                    description: "Sources publiques ajoutées par l'administration.",
                    path: "donnees-insee/diffusion",
                    type: "admin" as const
                }
            ].map(datasource => (
                <Grid size={{ xs: 12, sm: 6 }} key={datasource.id}>
                    <S3EntryCard
                        {...datasource}
                        onCardClick={
                            () => console.log(`Navigating to ${datasource.path}`)
                            //routes[route.name]({ path: "ddecrulle/" }).push()
                        }
                    />
                </Grid>
            ))}
        </Grid>
    );
}
