/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

export function range(start: number, end: number, step = 1): IterableIterator<number> {
    return {
        [Symbol.iterator]() {
            return this;
        },
        next() {
            if (start < end) {
                const result = { value: start, done: false };

                start += step;

                return result;
            }
            return { done: true, value: end };
        }
    }
}
