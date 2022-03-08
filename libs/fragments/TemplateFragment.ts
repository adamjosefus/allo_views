/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

export abstract class TemplateFragment {

    content: string;
    readonly #paramsParser = /(?<quote>"|'|)\{\$(?<name>[a-z_]+[A-z0-9_]*)(\((?<args>.*)\)){0,1}(?<filters>(\|[a-z_]+)*)\}\1/gi;

    constructor(content: string) {
        this.content = content;
    }


    render(_params: unknown): string {
        throw new Error("Method not implemented.");
    }


    // #processRenderString(context: ContextOptions, s: string, templateParams: ParamsType<unknown> = {}) {
    //     this.#paramsParser.lastIndex = 0;
    //     // deno-lint-ignore no-explicit-any
    //     const final = s.replace(this.#paramsParser, (_match: string, ...exec: any[]) => {
    //         const [_g1, _g2, _g3, _g4, _g5, _g6, _pos, _content, groups] = exec;
    //         const paramName = groups.name as string;
    //         const quote = (s => s.length > 0 ? s : null)(groups.quote as string);

    //         const paramFilters: string[] = ((s) => {
    //             return s
    //                 .split('|')
    //                 .map(v => v.trim())
    //                 .filter(v => v !== '')
    //                 .filter((v, i, arr) => arr.indexOf(v) == i);
    //         })(groups.filters as string);

    //         const paramInput = templateParams[paramName];

    //         // Args
    //         // deno-lint-ignore no-explicit-any
    //         const paramArgs: any[] | null = ((s: string | undefined) => {
    //             if (s !== undefined) return JSON.parse(`[${s}]`);
    //             else return null;
    //         })(groups.args)


    //         // Value
    //         const value = (() => {
    //             if (paramInput !== undefined) {
    //                 if (paramArgs !== null) {
    //                     if (typeof paramInput === 'function') return paramInput(...paramArgs);
    //                     else throw new TemplateError(`Param "${paramName}" is not a function.`);
    //                 } else return paramInput;
    //             } else throw new TemplateError(`Param "${paramName}" has no value.`);
    //         })()

    //         // Filters
    //         const filters = ((names) => {
    //             const arr = names.reduce((acc: FilterNormalizedCallbackType[], n) => {
    //                 acc.push(this.#getFilter(n));

    //                 return acc;
    //             }, []);

    //             return arr;
    //         })(paramFilters)


    //         const raw = ((v, filters) => {
    //             return filters.reduce((v, f) => f(context, v), v);
    //         })(value, filters);


    //         // Final value
    //         const contentPart = ((s) => {
    //             switch (context) {
    //                 case ContextOptions.HtmlContent:
    //                     if (quote !== null) return html`"${s}"`;
    //                     else return html`${s}`;

    //                 case ContextOptions.JsContent:
    //                     return js`${s}`;

    //                 default: throw new TemplateError(`Unknown renderning context "${context}"`);
    //             }
    //         })(raw);

    //         return contentPart.toString();
    //     });

    //     return final;
    // }
}
