export function parseUrl(url: string) {
    const { host, protocol, pathname } = new URL(url);
    return {
        host,
        port: (() => {
            const portStr = pathname.split(":")[1];

            if (portStr !== undefined) {
                const port = parseInt(portStr);

                if (isNaN(port)) {
                    throw new Error("url malformed");
                }

                return port;
            }

            switch (protocol) {
                case "http:":
                    return 80;
                case "https:":
                    return 443;
            }

            return undefined;
        })()
    };
}
