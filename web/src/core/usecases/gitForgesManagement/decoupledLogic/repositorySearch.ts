import type { GitRepository } from "core/ports/GitForge";

/** What is known of the repositories of a forge, so a search shows them right away */
export type RepositorySearchCache = {
    /** In the order they were received: what is shown doesn't move when more arrive */
    repositories: GitRepository[];
    /** Every repository of the user is in repositories, nothing more to ask the forge */
    isComplete: boolean;
    /** What the forge answered, by normalized search, every page fetched */
    repositoryIdsBySearch: Record<string, string[]>;
    /** The page to ask for more, by normalized search. undefined: it was the last one */
    nextPageBySearch: Record<string, number | undefined>;
};

function normalizeSearch(search: string): string {
    return search.trim().toLowerCase();
}

/** Whether the forge has to be asked, what is known being shown in the meantime */
export function getIsRepositorySearchNeeded(params: {
    cache: RepositorySearchCache | undefined;
    search: string;
}): boolean {
    const { cache, search } = params;

    if (cache === undefined) {
        return true;
    }

    return !cache.isComplete && !(normalizeSearch(search) in cache.repositoryIdsBySearch);
}

/** The page to ask the forge for more matches, undefined when there is none */
export function getRepositorySearchNextPage(params: {
    cache: RepositorySearchCache | undefined;
    search: string;
}): number | undefined {
    const { cache, search } = params;

    if (cache === undefined || cache.isComplete) {
        return undefined;
    }

    return cache.nextPageBySearch[normalizeSearch(search)];
}

export function updateRepositorySearchCache(params: {
    cache: RepositorySearchCache | undefined;
    search: string;
    /** 1 by default, a later one is added to what the first ones answered */
    page?: number;
    repositories: GitRepository[];
    hasNextPage: boolean;
}): RepositorySearchCache {
    const { cache, search, page = 1, repositories, hasNextPage } = params;

    const search_normalized = normalizeSearch(search);

    const repositoryById = new Map(
        repositories.map(repository => [repository.id, repository])
    );
    const knownIds = new Set(cache?.repositories.map(({ id }) => id));

    return {
        repositories: [
            ...(cache?.repositories ?? []).map(
                repository => repositoryById.get(repository.id) ?? repository
            ),
            ...repositories.filter(({ id }) => !knownIds.has(id))
        ],
        isComplete:
            (cache?.isComplete ?? false) || (search_normalized === "" && !hasNextPage),
        repositoryIdsBySearch: {
            ...cache?.repositoryIdsBySearch,
            [search_normalized]: [
                ...(page === 1
                    ? []
                    : (cache?.repositoryIdsBySearch[search_normalized] ?? [])),
                ...repositories.map(({ id }) => id)
            ]
        },
        nextPageBySearch: {
            ...cache?.nextPageBySearch,
            [search_normalized]: hasNextPage ? page + 1 : undefined
        }
    };
}

/**
 * The known repositories matching the search, and the ones the forge answered for it
 * even if they don't look like a match: each forge searches its own way.
 */
export function getRepositorySearchMatches(params: {
    cache: RepositorySearchCache | undefined;
    search: string;
}): GitRepository[] {
    const { cache, search } = params;

    if (cache === undefined) {
        return [];
    }

    const search_normalized = normalizeSearch(search);

    const repositoryIds_answered = new Set(
        cache.repositoryIdsBySearch[search_normalized]
    );

    return cache.repositories.filter(
        ({ id, name, fullPath }) =>
            repositoryIds_answered.has(id) ||
            fullPath.toLowerCase().includes(search_normalized) ||
            name.toLowerCase().includes(search_normalized)
    );
}
