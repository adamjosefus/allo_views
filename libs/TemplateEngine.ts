/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { TemplateFactory } from "./TemplateFactory.ts";
import { TemplateError } from "./TemplateError.ts";
import { RenderingContext } from "./RenderingContext.ts";
import * as Filters from "./filters.ts";
import { type Template } from "./Template.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";



export type FilterCallbackType = {
    // deno-lint-ignore no-explicit-any
    (...args: any[]): any;
}

type FilterNormalizedCallbackType = {
    // deno-lint-ignore no-explicit-any
    (context: RenderingContext, ...args: any[]): any;
}


export class TemplateEngine {

    readonly #templateCache = new Cache<Template>()

    readonly #templateFactory: TemplateFactory;
    readonly #filters: Map<string, FilterNormalizedCallbackType> = new Map();


    constructor() {
        this.#templateFactory = new TemplateFactory()

        // this.#addNormalizedFilter('noescape', Filters.noescape);
        // this.#addNormalizedFilter('json', Filters.json);
        // this.#addNormalizedFilter('markdown', Filters.markdown);

        this.addFilter('trim', Filters.trim);
        this.addFilter('lower', Filters.lower);
        this.addFilter('upper', Filters.upper);
        this.addFilter('firstUpper', Filters.firstUpper);
    }


    addFilter(name: string, callback: FilterCallbackType): void {
        this.#addNormalizedFilter(name, (_tag, ...args) => callback(...args));
    }


    #addNormalizedFilter(name: string, callback: FilterNormalizedCallbackType): void {
        if (this.#hasFilter(name)) throw new TemplateError(`Filter "${name}" is already exists.`);

        this.#filters.set(name, callback)
    }


    #hasFilter(name: string): boolean {
        return this.#filters.has(name);
    }


    #getFilter(name: string): FilterNormalizedCallbackType {
        if (!this.#hasFilter(name)) throw new TemplateError(`Filter not found by name "${name}".`);

        return this.#filters.get(name)!;
    }


    /**
     * @param path File path to template.
     * @param params Parameters to render.
     * @returns Rendered template.
     */
    render(path: string, params: Record<string, unknown> = {}): string {
        const template = this.#templateCache.load(path, () => {
            return this.#templateFactory.create(path);
        });

        return template.render(params);
    }
}
