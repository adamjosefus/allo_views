import { TemplateError } from "./TemplateError.ts";
import { ContentPart } from "./ContentPart.ts";
import { HtmlContentPart, html } from "./HtmlContentPart.ts";
import { JsContentPart, js } from "./JsContentPart.ts";
import { Cache } from "./Cache.ts";
import { Marked as Markdown } from "https://deno.land/x/markdown/mod.ts";


// deno-lint-ignore no-explicit-any
export type ParamsType<ValueType> = Record<string, ValueType>;


export type FilterCallbackType = {
    // deno-lint-ignore no-explicit-any
    (...args: any[]): any;
}

type FilterNormalizedCallbackType = {
    // deno-lint-ignore no-explicit-any
    (context: RenderingContext, ...args: any[]): any;
}

type FilterListType = {
    name: string,
    callback: FilterNormalizedCallbackType,
}[];


type ContentType = {
    htmlParts: string[],
    scriptParts: string[],
};


type FileCacheType<ValueType> = {
    value: ValueType,
}


const enum RenderingContext {
    HTML = 'html',
    JS = 'js'
}


export class Template {

    private readonly scriptElementParser = /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs;
    private readonly paramsParser = /(?<quote>"|'|)\{\$(?<name>[a-z_]+[A-z0-9_]*)(\((?<args>.*)\)){0,1}(?<filters>(\|[a-z_]+)*)\}\1/gi;

    private _filters: FilterListType = [];
    private _contentCache = new Cache<ContentType>();


    constructor() {
        this._addNormalizedFilter('noescape', (ctx: RenderingContext, s: string) => {
            return this._createContentPartByContext(ctx, s);
        });

        this._addNormalizedFilter('json', (_ctx: RenderingContext, s: any) => {
            return this._createContentPartByContext(RenderingContext.JS, JSON.stringify(s));
        });

        this._addNormalizedFilter('markdown', (_ctx: RenderingContext, s: any) => {
            return this._createContentPartByContext(RenderingContext.HTML, Markdown.parse(s).content);
        });

        this.addFilter('trim', (s: string) => s.trim());
        this.addFilter('lower', (s: string) => s.toLowerCase());
        this.addFilter('upper', (s: string) => s.toUpperCase());
        this.addFilter('firstUpper', (s: string) => s.substring(0, 1).toUpperCase() + s.substring(1));
    }


    // deno-lint-ignore no-explicit-any
    private _createContentPartByContext(context: RenderingContext, bases: string[] | string, values: any[] = []): ContentPart {
        switch (context) {
            case RenderingContext.HTML:
                return new HtmlContentPart(bases, values);

            case RenderingContext.JS:
                return new JsContentPart(bases, values);

            default:
                throw new TemplateError(`Unknown renderning context "${context}"`);
        }
    }


    addFilter(name: string, callback: FilterCallbackType): void {
        this._addNormalizedFilter(name, (_tag, ...args) => callback(...args));
    }


    private _addNormalizedFilter(name: string, callback: FilterNormalizedCallbackType): void {
        if (this._hasFilter(name)) throw new TemplateError(`Filter "${name}" is already exists.`);

        this._filters.push({ name, callback });
    }


    private _hasFilter(name: string): boolean {
        return this._findFilterItem(name) ? true : false;
    }


    private _getFilter(name: string): FilterNormalizedCallbackType {
        if (this._hasFilter(name)) {
            return this._findFilterItem(name)!.callback
        } else throw new TemplateError(`Filter not found by name "${name}".`);
    }


    private _findFilterItem(name: string) {
        return this._filters.find(f => f.name == name);
    }


    // deno-lint-ignore no-explicit-any
    render(templatePath: string, templateParams: ParamsType<any> = {}): string {
        const { htmlParts, scriptParts } = this._getContent(templatePath);

        return this._render(htmlParts, scriptParts, templateParams);
    }


    // deno-lint-ignore no-explicit-any
    private _render(htmlContents: string[], scriptContents: string[], templateParams: ParamsType<any>) {
        const buffer: string[] = [];

        for (let i = 0; i < Math.max(htmlContents.length, scriptContents.length); i++) {
            const html = htmlContents[i];
            if (html) buffer.push(this._processRenderString(RenderingContext.HTML, html, templateParams));

            const js = scriptContents[i];
            if (js) buffer.push(this._processRenderString(RenderingContext.JS, js, templateParams));
        }

        return buffer.join('');
    }


    private _getContent(templatePath: string): ContentType {
        const cached = this._loadCacheContent(templatePath);
        if (cached) return cached;

        const stat = Deno.statSync(templatePath);
        stat.mtime?.getTime() ?? 0;

        const created = this._createContent(templatePath);
        this._saveCacheContent(templatePath, created.htmlParts, created.scriptParts);

        return created;
    }


    private _createContent(templatePath: string): ContentType {
        const source = Deno.readTextFileSync(templatePath);

        const [sliceIndexes, scriptParts] = (() => {
            const slices: number[] = [];
            const contents: string[] = [];

            let result: RegExpExecArray | null = null

            this.scriptElementParser.lastIndex = 0;
            while ((result = this.scriptElementParser.exec(source)) !== null) {
                const { openTag, content, closeTag } = result.groups as Record<string, string>;
                const offset = this.scriptElementParser.lastIndex - (openTag.length + content.length + closeTag.length);

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


    private _saveCacheContent(templatePath: string, htmlParts: string[], scriptParts: string[]): void {
        const stats = Deno.statSync(templatePath);
        this._contentCache.save(templatePath, { htmlParts, scriptParts }, stats.mtime?.getTime());
    }


    private _loadCacheContent(templatePath: string): ContentType | null {
        const stats = Deno.statSync(templatePath);
        return this._contentCache.load(templatePath, stats.mtime?.getTime());
    }


    // deno-lint-ignore no-explicit-any
    private _processRenderString(context: RenderingContext, s: string, templateParams: ParamsType<any> = {}) {
        this.paramsParser.lastIndex = 0;
        // deno-lint-ignore no-explicit-any
        const final = s.replace(this.paramsParser, (_match: string, ...exec: any[]) => {
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
                    acc.push(this._getFilter(n));

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
                    case RenderingContext.HTML:
                        if (quote !== null) return html`"${s}"`;
                        else return html`${s}`;

                    case RenderingContext.JS:
                        return js`${s}`;

                    default: throw new TemplateError(`Unknown renderning context "${context}"`);
                }
            })(raw);

            return contentPart.toString();
        });

        return final;
    }
}
