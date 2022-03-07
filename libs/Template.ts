/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";
import { Marked as Markdown } from "https://deno.land/x/markdown@v2.0.0/mod.ts";

import { TemplateError } from "./TemplateError.ts";
import { Context } from "./Context.ts";
import { Fragment, createFragment, HtmlContentFragment, html, JsContentFragment, js } from "./fragments/mod.ts";


export type ParamsType<ValueType> = Record<string, ValueType>;


export type FilterCallbackType = {
    // deno-lint-ignore no-explicit-any
    (...args: any[]): any;
}

type FilterNormalizedCallbackType = {
    // deno-lint-ignore no-explicit-any
    (context: Context, ...args: any[]): any;
}

type FilterListType = {
    name: string,
    callback: FilterNormalizedCallbackType,
}[];


type ContentPartsType = {
    htmlParts: string[],
    scriptParts: string[],
};


export class Template {

    readonly #scriptElementParser = /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs;
    readonly #paramsParser = /(?<quote>"|'|)\{\$(?<name>[a-z_]+[A-z0-9_]*)(\((?<args>.*)\)){0,1}(?<filters>(\|[a-z_]+)*)\}\1/gi;

    #filters: FilterListType = [];
    #cache = new Cache<ContentPartsType>();


    constructor() {
        this.#addNormalizedFilter('noescape', (ctx: Context, s: string) => {
            return createFragment(ctx, s);
        });

        this.#addNormalizedFilter('json', (_ctx: Context, s: unknown) => {
            return createFragment(Context.JsContent, JSON.stringify(s));
        });

        this.#addNormalizedFilter('markdown', (_ctx: Context, s: string) => {
            return createFragment(Context.HtmlContent, Markdown.parse(s).content);
        });

        this.addFilter('trim', (s: string) => s.trim());
        this.addFilter('lower', (s: string) => s.toLowerCase());
        this.addFilter('upper', (s: string) => s.toUpperCase());
        this.addFilter('firstUpper', (s: string) => s.substring(0, 1).toUpperCase() + s.substring(1));
    }


    addFilter(name: string, callback: FilterCallbackType): void {
        this.#addNormalizedFilter(name, (_tag, ...args) => callback(...args));
    }


    #addNormalizedFilter(name: string, callback: FilterNormalizedCallbackType): void {
        if (this.#hasFilter(name)) throw new TemplateError(`Filter "${name}" is already exists.`);

        this.#filters.push({ name, callback });
    }


    #hasFilter(name: string): boolean {
        return this.#findFilterItem(name) ? true : false;
    }


    #getFilter(name: string): FilterNormalizedCallbackType {
        if (this.#hasFilter(name)) {
            return this.#findFilterItem(name)!.callback
        } else throw new TemplateError(`Filter not found by name "${name}".`);
    }


    #findFilterItem(name: string) {
        return this.#filters.find(f => f.name == name);
    }


    render(templatePath: string, templateParams: ParamsType<unknown> = {}): string {
        const { htmlParts, scriptParts } = this.#getContent(templatePath);

        return this.#render(htmlParts, scriptParts, templateParams);
    }


    #render(htmlContents: string[], scriptContents: string[], templateParams: ParamsType<unknown>) {
        const buffer: string[] = [];

        for (let i = 0; i < Math.max(htmlContents.length, scriptContents.length); i++) {
            const html = htmlContents[i];
            if (html) buffer.push(this.#processRenderString(Context.HtmlContent, html, templateParams));

            const js = scriptContents[i];
            if (js) buffer.push(this.#processRenderString(Context.JsContent, js, templateParams));
        }

        return buffer.join('');
    }


    #getContent(templatePath: string): ContentPartsType {
        return this.#cache.load(templatePath, () => this.#createContent(templatePath), {
            files: [templatePath]
        });
    }


    #createContent(templatePath: string): ContentPartsType {
        const source = Deno.readTextFileSync(templatePath);

        const [sliceIndexes, scriptParts] = (() => {
            const slices: number[] = [];
            const contents: string[] = [];

            let result: RegExpExecArray | null = null

            this.#scriptElementParser.lastIndex = 0;
            while ((result = this.#scriptElementParser.exec(source)) !== null) {
                const { openTag, content, closeTag } = result.groups as Record<string, string>;
                const offset = this.#scriptElementParser.lastIndex - (openTag.length + content.length + closeTag.length);

                const sliceStartsAt = offset + openTag.length;
                const sliceEndsAt = sliceStartsAt + content.length;

                slices.push(sliceStartsAt, sliceEndsAt);
                contents.push(content);
            }

            return [slices, contents] as [number[], string[]];
        })()

        const htmlParts = ((s, slices) => {
            const buffer: string[] = [];

            for (let i = 0; i < slices.length; i += 2) {
                const start = slices[i];
                const end = slices[i + 1];

                buffer.push(s.substring(start, end));
            }

            return buffer;
        })(source, [0, ...sliceIndexes])

        return {
            htmlParts,
            scriptParts
        }
    }


    #processRenderString(context: Context, s: string, templateParams: ParamsType<unknown> = {}) {
        this.#paramsParser.lastIndex = 0;
        // deno-lint-ignore no-explicit-any
        const final = s.replace(this.#paramsParser, (_match: string, ...exec: any[]) => {
            const [_g1, _g2, _g3, _g4, _g5, _g6, _pos, _content, groups] = exec;
            const paramName = groups.name as string;
            const quote = (s => s.length > 0 ? s : null)(groups.quote as string);

            const paramFilters: string[] = ((s) => {
                return s
                    .split('|')
                    .map(v => v.trim())
                    .filter(v => v !== '')
                    .filter((v, i, arr) => arr.indexOf(v) == i);
            })(groups.filters as string);

            const paramInput = templateParams[paramName];

            // Args
            // deno-lint-ignore no-explicit-any
            const paramArgs: any[] | null = ((s: string | undefined) => {
                if (s !== undefined) return JSON.parse(`[${s}]`);
                else return null;
            })(groups.args)


            // Value
            const value = (() => {
                if (paramInput !== undefined) {
                    if (paramArgs !== null) {
                        if (typeof paramInput === 'function') return paramInput(...paramArgs);
                        else throw new TemplateError(`Param "${paramName}" is not a function.`);
                    } else return paramInput;
                } else throw new TemplateError(`Param "${paramName}" has no value.`);
            })()

            // Filters
            const filters = ((names) => {
                const arr = names.reduce((acc: FilterNormalizedCallbackType[], n) => {
                    acc.push(this.#getFilter(n));

                    return acc;
                }, []);

                return arr;
            })(paramFilters)


            const raw = ((v, filters) => {
                return filters.reduce((v, f) => f(context, v), v);
            })(value, filters);


            // Final value
            const contentPart = ((s) => {
                switch (context) {
                    case Context.HtmlContent:
                        if (quote !== null) return html`"${s}"`;
                        else return html`${s}`;

                    case Context.JsContent:
                        return js`${s}`;

                    default: throw new TemplateError(`Unknown renderning context "${context}"`);
                }
            })(raw);

            return contentPart.toString();
        });

        return final;
    }
}
