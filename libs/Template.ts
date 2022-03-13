import { join, isAbsolute } from "https://deno.land/std@0.128.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";
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
        this.#fragments.map()
        return this.#sourceContent;
    }
}
