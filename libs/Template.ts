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


type RenderCallback = (params: ParamsType) => string;


export class Template {

    readonly #path: string;
    readonly #fragmentFactory: ContextFragmentFactory;
    readonly #expressionsParser: ExpressionsParser;

    readonly renderCallbackCache = new Cache<RenderCallback>()


    constructor(path: string, fragmentFactory: ContextFragmentFactory, expressionsParser: ExpressionsParser) {
        this.#path = isAbsolute(path) ? path : join(Deno.cwd(), path);
        this.#fragmentFactory = fragmentFactory;
        this.#expressionsParser = expressionsParser;
    }


    render(params: ParamsType): string {
        const callback = this.renderCallbackCache.load(this.#path, () => this.#createRenderCallback(), {
            files: [this.#path],
        });

        return callback(params);
    }


    #createRenderCallback(): (params: ParamsType) => string {
        const source = Deno.readTextFileSync(this.#path)

        return (params: ParamsType) => {
            const fragments = this.#fragmentFactory.create(source);

            const result = fragments.reduce((acc: string[], fragment) => {
                const [bases, expressions] = this.#expressionsParser.parse(fragment.sourceContent);

                acc.push(renderFragmentContent(bases, expressions, params));
                return acc;
            }, []).join('');

            return result;
        }
    }
}
