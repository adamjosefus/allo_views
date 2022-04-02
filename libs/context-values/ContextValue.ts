/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { type ParamsType } from "../ParamsType.ts";


export abstract class ContextValue {
    protected strings: readonly string[];
    protected values: readonly unknown[];


    constructor(strings: string[] | string, values: unknown[] = []) {
        this.strings = [strings].flat();
        this.values = values;
    }


    // deno-lint-ignore no-unused-vars
    static escape(value: unknown): string {
        throw new Error("Not implemented");
    }


    abstract render(params: ParamsType): string;
}


export type ContextTagType = {
    // deno-lint-ignore no-explicit-any
    (strings: TemplateStringsArray, ...values: any[]): ContextValue
}
