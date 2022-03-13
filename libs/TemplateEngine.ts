/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { join, isAbsolute } from "https://deno.land/std@0.128.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";
import { TemplateError } from "./TemplateError.ts";
import { EscapeContext, html, js } from "./contexts/mod.ts";
import { FragmentsParser } from "./FragmentsParser.ts";
import { FragmentType } from "./FragmentType.ts";
import * as Filters from "./filters.ts";
import { Template } from "./Template.ts";



export type FilterCallbackType = {
    // deno-lint-ignore no-explicit-any
    (...args: any[]): any;
}

type FilterNormalizedCallbackType = {
    // deno-lint-ignore no-explicit-any
    (context: EscapeContext, ...args: any[]): any;
}



export class TemplateEngine {

    readonly #filters: Map<string, FilterNormalizedCallbackType> = new Map();
    readonly #fragmentsCache = new Cache<FragmentType[]>();
    readonly #fragmentsParser = new FragmentsParser();

    constructor() {
        this.#addNormalizedFilter('noescape', Filters.noescape);
        this.#addNormalizedFilter('json', Filters.json);
        this.#addNormalizedFilter('markdown', Filters.markdown);

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
     * 
     * @param path File path to template.
     * @param params Parameters to render.
     * @returns Rendered template.
     */
    render(path: string, params: Record<string, unknown> = {}): string {
        // TODO: Add cache.
        const template = new Template(path)

        return template.render(params);
    }


    // TODO: render to response


    /**
     * Create template fragments from source file.
     * @param path File path to template.
     * @returns 
     */
    #createFragments(path: string): FragmentType[] {
        const absolutePath = isAbsolute(path) ? path : join(Deno.cwd(), path);
        const source = Deno.readTextFileSync(absolutePath);

        return this.#fragmentsParser.parse(source);
    }
}
