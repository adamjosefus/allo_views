export abstract class ContentFragment {
    protected _bases: string[];
    protected _values: unknown[];


    // deno-lint-ignore no-explicit-any
    constructor(bases: string[] | string, values: any[] = []) {
        this._bases = typeof bases == 'string' ? [bases] : bases;
        this._values = values;
    }


    // deno-lint-ignore no-explicit-any
    abstract escape(s: any): string;


    abstract toString(): string;
}


export type contextTagType = {
    // deno-lint-ignore no-explicit-any
    (contents: TemplateStringsArray, ...expressions: any[]): ContentFragment
}