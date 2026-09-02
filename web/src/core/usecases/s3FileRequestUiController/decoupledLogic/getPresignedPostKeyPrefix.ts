export function getPresignedPostKeyPrefix(params: {
    presignedPost_fields: Record<string, string>;
}): string | undefined {
    const { presignedPost_fields } = params;

    const encodedPolicy =
        presignedPost_fields["Policy"] ?? presignedPost_fields["policy"];

    if (encodedPolicy === undefined) {
        return undefined;
    }

    let decodedPolicy: unknown;

    try {
        const bytes = Uint8Array.from(atob(encodedPolicy), character =>
            character.charCodeAt(0)
        );

        decodedPolicy = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return undefined;
    }

    if (
        typeof decodedPolicy !== "object" ||
        decodedPolicy === null ||
        !("conditions" in decodedPolicy) ||
        !Array.isArray(decodedPolicy.conditions)
    ) {
        return undefined;
    }

    for (const condition of decodedPolicy.conditions) {
        if (!Array.isArray(condition)) {
            continue;
        }

        const [operator, field, prefix] = condition;

        if (
            operator !== "starts-with" ||
            field !== "$key" ||
            typeof prefix !== "string"
        ) {
            continue;
        }

        return prefix;
    }

    return undefined;
}
