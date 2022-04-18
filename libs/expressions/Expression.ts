import { type ExpressionRenderCallback } from "./ExpressionRenderCallback.ts";
import { type ParamsType } from "../ParamsType.ts";
import { FilterType } from "../filters/FilterType.ts";
import { StaticContextValue } from "../context-values/CommonContextValue.ts";


type GetArgumentsCallback = (params: ParamsType) => unknown[];


/**
 * @internal
 */
export class Expression {

    readonly #callback: ExpressionRenderCallback;
    readonly #filters: {
        name: string,
        getArguments: GetArgumentsCallback,
    }[] = [];

    constructor(callback: ExpressionRenderCallback) {
        this.#callback = callback;
    }


    render(ctx: StaticContextValue, params: ParamsType, allFilters: Map<string, FilterType>): unknown {
        const value = this.#callback(params);

        return this.#filters.reduce((value, f) => {
            return value;

            if (!allFilters.has(f.name)) throw new Error(`Filter "${f.name}" not found.`);

            const filter = allFilters.get(f.name)!;
            return filter(ctx, value, f.getArguments(params));

        }, value);
    }


    assignFilter(name: string, getArguments: GetArgumentsCallback) {
        console.log("assignFilter", name, getArguments);

        this.#filters.push({
            name,
            getArguments,
        });
    }
}