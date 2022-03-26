import { join, isAbsolute } from "https://deno.land/std@0.132.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";
import { compileTemplateFragment } from "./compileTemplateFragment.ts";
import { FragmentsFactory } from "./FragmentsFactory.ts";
import { FragmentType } from "./FragmentType.ts";


export class Template {
    // Properties
    readonly #path: string;

    // Models
    readonly #fragmentsFactory = new FragmentsFactory();

    // Caches
    readonly #sourceContentCache = new Cache<string>();
    readonly #fragmentsCache = new Cache<FragmentType[]>();


    constructor(path: string) {
        this.#path = isAbsolute(path) ? path : join(Deno.cwd(), path);
    }


    get #sourceContent(): string {
        const file = this.#path;
        return this.#sourceContentCache.load(file, () => {
            return Deno.readTextFileSync(file);
        }, { files: [file] });
    }


    get #fragments(): FragmentType[] {
        const file = this.#path;
        return this.#fragmentsCache.load(file, () => {
            return this.#fragmentsFactory.create(this.#sourceContent);
        }, { files: [file] });
    }


    render(params: Record<string, unknown>): string {
        const s = this.#fragments.map(fr => {
            const [bases, expressions] = compileTemplateFragment(fr.sourceContent);

            const blankSerializer = (_params: Record<string, unknown>) => "";
            return bases.reduce((acc: string[], base, i) => {
                const serializer = expressions[i] ?? blankSerializer;
                const expressionValue = serializer(params);

                return [...acc, base, `${expressionValue}`];
            }, []);
        }).flat().join('');

        return s;
    }
}
