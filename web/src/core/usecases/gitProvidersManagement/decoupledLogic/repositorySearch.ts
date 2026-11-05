import type { GitRepository } from "core/ports/GitProvider";

/** What is known of the repositories of a provider, so a search shows them right away */
export type RepositorySearchCache = {
    /** In the order they were received: what is shown doesn't move when more arrive */
    repositories: GitRepository[];
    /** Every repository of the user is in repositories, nothing more to ask the provider */
    isComplete: boolean;
    /** What the provider answered, by normalized search */
    repositoryIdsBySearch: Record<string, string[]>;
};

function normalizeSearch(search: string): string {
    return search.trim().toLowerCase();
}

/** Whether the provider has to be asked, what is known being shown in the meantime */
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

export function updateRepositorySearchCache(params: {
    cache: RepositorySearchCache | undefined;
    search: string;
    repositories: GitRepository[];
    hasNextPage: boolean;
}): RepositorySearchCache {
    const { cache, search, repositories, hasNextPage } = params;

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
            [search_normalized]: repositories.map(({ id }) => id)
        }
    };
}

/**
 * The known repositories matching the search, and the ones the provider answered for it
 * even if they don't look like a match: each provider searches its own way.
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
