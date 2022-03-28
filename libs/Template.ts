import { join, isAbsolute } from "https://deno.land/std@0.132.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";
import { RenderingContext } from "./RenderingContext.ts";
import { type ContextFragmentFactory } from "./ContextFragmentFactory.ts";
import { ParamsType } from "./ParamsType.ts";
import { ExpressionsParser } from "./ExpressionsParser.ts";
import { renderFragmentContent } from "./renderFragmentContent.ts";


/**
 * @internal
 */
export type SourceFragmentType = {
    escapeContext: RenderingContext,
    sourceText: string,
}


export class Template {

    readonly #path: string;
    readonly #fragmentFactory: ContextFragmentFactory;
    readonly #expressionsParser: ExpressionsParser;

    readonly #sourceCache = new Cache<string>()


    constructor(path: string, fragmentFactory: ContextFragmentFactory, expressionsParser: ExpressionsParser) {
        this.#path = isAbsolute(path) ? path : join(Deno.cwd(), path);
        this.#fragmentFactory = fragmentFactory;
        this.#expressionsParser = expressionsParser;
    }


    #getSource(): string {
        return this.#sourceCache.load(this.#path, () => {
            return Deno.readTextFileSync(this.#path);
        }, {
            files: [this.#path]
        });
    }


    render(params: ParamsType): string {
        // TODO: Add Cache
        return this.#render(params);
    }


    #render(params: ParamsType): string {
        const fragments = this.#fragmentFactory.create(this.#getSource());        

        const result = fragments.reduce((acc: string[], fragment) => {
            const [bases, expressions] = this.#expressionsParser.parse(fragment.sourceContent);

            acc.push(renderFragmentContent(bases, expressions, params));

            return acc;
        }, []).join('');

        return result;
    }
}
