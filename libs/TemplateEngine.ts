/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { TemplateFactory } from "./TemplateFactory.ts";
import { type Template } from "./Template.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";


export class TemplateEngine {

    readonly #templateCache = new Cache<Template>()

    readonly #templateFactory: TemplateFactory;
    // readonly #filters: Map<string, FilterNormalizedCallbackType> = new Map();


    constructor() {
        this.#templateFactory = new TemplateFactory()

        // this.#addNormalizedFilter('noescape', Filters.noescape);
        // this.#addNormalizedFilter('json', Filters.json);
        // this.#addNormalizedFilter('markdown', Filters.markdown);

        // this.addFilter('trim', Filters.trim);
        // this.addFilter('lower', Filters.lower);
        // this.addFilter('upper', Filters.upper);
        // this.addFilter('firstUpper', Filters.firstUpper);
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
