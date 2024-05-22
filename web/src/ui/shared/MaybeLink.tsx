import MuiLink from "@mui/material/Link";

export function MaybeLink(props: {
    href: string | undefined;
    children: React.ReactNode;
}) {
    const { href } = props;
    return href === undefined ? (
        <>{props.children}</>
    ) : (
        <MuiLink href={href} target="_blank">
            {props.children}
        </MuiLink>
    );
}
