export abstract class ContentFragment {
    #parts: string[];
    #values: unknown[];


    // deno-lint-ignore no-explicit-any
    constructor(parts: string[] | string, values: any[] = []) {
        this.#parts = typeof parts == 'string' ? [parts] : parts;
        this.#values = values;
    }


    // deno-lint-ignore no-explicit-any
    abstract escape(s: any): string;


    abstract toString(): string;
}


export type contextTagType = {
    // deno-lint-ignore no-explicit-any
    (contents: TemplateStringsArray, ...expressions: any[]): ContentFragment
}