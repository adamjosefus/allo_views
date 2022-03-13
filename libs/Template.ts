import { join, isAbsolute } from "https://deno.land/std@0.128.0/path/mod.ts";
import { Cache } from "https://deno.land/x/allo_caching@v1.2.0/mod.ts";


export class Template {

    readonly #path: string;
    readonly #sourceCache = new Cache<string>();

    readonly #maskParser = /\{\{((?<name>\w+)|(\=(["']?)(?<value>.+)\4))((?<filters>(\|\w+(\:.+)*)*)|(\u0020+(?<atributte>.+?)))?\}\}/g;


    constructor(path: string) {
        this.#path = isAbsolute(path) ? path : join(Deno.cwd(), path);
    }


    get #source(): string {
        const file = this.#path;

        return this.#sourceCache.load(file, () => Deno.readTextFileSync(file), { files: [file] });
    }


    // get #fragments(): TemplateFragment[] {
    //     return this.#fragmentsParser.parse(this.#source);
    // }


    render(params: Record<string, unknown>): string {
        return this.#source;
    }

    
    #findMasks(source: string) {
        const masks = new Map<string, string>();

        let match: RegExpMatchArray | null;
        while ((match = this.#maskParser.exec(source)) !== null) {
            const {name, value, filters, atributte} = match.groups ?? {};

        }

        return masks;
    }
}
