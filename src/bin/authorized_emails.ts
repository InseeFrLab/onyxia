//This is just a helper to generate the regexp that defines email allowed to register

/* spell-checker: disable */
const str = `insee.fr, gouv.fr, ensae.fr, ensai.fr, ign.fr, has-sante.fr, casd.eu, ars.sante.fr, cnaf.fr, ac-lille.fr, ac-amiens.fr, ac-normandie.fr, ac-reims.fr, ac-nancy-metz.fr, ac-strasbourg.fr, ac-creteil.fr, ac-paris.fr, ac-versailles.fr, ac-rennes.fr, ac-nantes.fr, ac-orleans-tours.fr, ac-dijon.fr, ac-besancon.fr, ac-poitiers.fr, ac-limoges.fr, ac-clermont.fr, ac-lyon.fr, ac-grenoble.fr, ac-bordeaux.fr, ac-toulouse.fr, ac-montpellier.fr, ac-aix-marseille.fr, ac-nice.fr, ac-corse.fr, ac-martinique.fr, ac-guadeloupe.fr, ac-reunion.fr, ac-guyane.fr, ac-mayotte.fr, ac-wf.wf, monvr.pf, ac-noumea.nc, ac-spm.fr`;
/* spell-checker: enable */

let pattern = str
    .split(", ")
    .map(t => t.replace(/\n/, ""))
    .map(t => t.replace(/^\*\./, ""))
    .map(t => t.replace(/\./g, "\\."))
    .map(t => `(${t})`)
    .join("|");

pattern = `@([^.]+\\.)?(${pattern})$`;

console.log(`pattern for Keycloak's email attribute: ${pattern}`);

const prettyPrint = pattern
    .match(/\?\((.+)\)\$$/)![1]
    .split("|")
    .map(part =>
        part
            .match(/\(?([^)]+)\)?$/)![1]
            .replace(/\\./, ".")
            .replace(/\$$/, ""),
    )
    .join(", ");

console.log(`\n\nprettyPrint: ${prettyPrint}`);

export {};
