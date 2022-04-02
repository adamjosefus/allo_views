/**
 * Slice input string by given indexes.
 */
export function sliceString(s: string, indexes: readonly number[]): readonly string[] {
    const arr: string[] = [];

    for (let i = 0; i < indexes.length; i += 2) {
        const start = indexes.at(i + 0);
        const end = indexes.at(i + 1);

        const slice = s.slice(start, end);

        arr.push(slice);
    }

    return arr;
}
