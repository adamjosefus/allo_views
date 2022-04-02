import { join, isAbsolute } from "https://deno.land/std@0.132.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";
import { RenderingContext } from "./RenderingContext.ts";
import { type ContextedValueFactory } from "./ContextedValueFactory.ts";
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
    readonly #contextedValueFactory: ContextedValueFactory;
    // readonly #expressionsParser: ExpressionsParser;

    readonly renderCallbackCache = new Cache<RenderCallback>()


    constructor(path: string, fragmentFactory: ContextedValueFactory) {
        this.#path = isAbsolute(path) ? path : join(Deno.cwd(), path);
        this.#contextedValueFactory = fragmentFactory;
        // this.#expressionsParser = expressionsParser;
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
            const snippets = this.#contextedValueFactory.create(source);

            return snippets.reduce((acc: string[], snippet) => {
                acc.push(snippet.render(params));
                return acc;
            }, []).join('');


            // const result = snippets.reduce((acc: string[], fragment) => {
            //     const [bases, expressions] = this.#expressionsParser.parse(fragment.sourceContent);

            //     acc.push(renderFragmentContent(fragment.renderingContext, bases, expressions, params));
            //     return acc;
            // }, []).join('');

            // return result;
        }
    }
}
