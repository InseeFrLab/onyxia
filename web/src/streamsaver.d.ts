declare module "streamsaver" {
    type StreamSaverWriteStreamOptions = {
        size?: number | null;
        pathname?: string | null;
        writableStrategy?: QueuingStrategy<Uint8Array>;
        readableStrategy?: QueuingStrategy<Uint8Array>;
    };

    const streamSaver: {
        createWriteStream: (
            filename: string,
            options?: StreamSaverWriteStreamOptions,
            size?: number
        ) => WritableStream<Uint8Array>;
        WritableStream: typeof WritableStream;
        supported: boolean;
        version: {
            full: string;
            major: number;
            minor: number;
            dot: number;
        };
        mitm: string;
    };

    export default streamSaver;
}
