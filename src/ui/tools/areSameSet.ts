export function areSameSet(set1: Set<unknown>, set2: Set<unknown>) {
    if (set1.size !== set2.size) {
        return false;
    }
    for (const elem of set1) {
        if (!set2.has(elem)) {
            return false;
        }
    }
    return true;
}
