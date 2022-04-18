import { join, isAbsolute } from "https://deno.land/std@0.135.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";
import { type ContextedValueFactory } from "./context-values/ContextedValueFactory.ts";
import { ParamsType } from "./ParamsType.ts";


/**
 * @internal
 */
export type SourceFragmentType = {
    // escapeContext: RenderingContext,
    sourceText: string,
}


type RenderCallback = (params: ParamsType) => string;


export class Template {

    readonly #path: string;
    readonly #contextedValueFactory: ContextedValueFactory;

    readonly renderCallbackCache = new Cache<RenderCallback>()


    constructor(path: string, fragmentFactory: ContextedValueFactory) {
        this.#path = isAbsolute(path) ? path : join(Deno.cwd(), path);
        this.#contextedValueFactory = fragmentFactory;
    }


    render(params: ParamsType): string {
        const callback = this.renderCallbackCache.load(this.#path, () => this.#createRenderCallback(), {
            files: [this.#path],
        });

        return callback(params);
    }


    #createRenderCallback(): (params: ParamsType) => string {
        const source = Deno.readTextFileSync(this.#path);

        return (params: ParamsType) => {
            const snippets = this.#contextedValueFactory.create(source);

            return snippets.reduce((acc: string[], snippet) => {
                acc.push(snippet.render(params));
                return acc;
            }, []).join('');
        }
    }
}
