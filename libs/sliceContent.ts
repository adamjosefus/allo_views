/**
 * Slice input string by given indexes.
 */
export function sliceContent(content: string, indexes: readonly number[]): readonly string[] {
    const arr: string[] = [];

    for (let i = 0; i < indexes.length; i += 2) {
        const start = indexes.at(i + 0);
        const end = indexes.at(i + 1);

        const slice = content.slice(start, end);

        arr.push(slice);
    }

    return arr;
}
