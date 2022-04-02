/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Expression } from "./ExpressionType.ts";
import { type ParamsType } from "./ParamsType.ts";


export abstract class ContextedValue {
    protected strings: readonly string[];
    protected keys: readonly unknown[];

    constructor(strings: string[] | string, keys: unknown[] = []) {
        this.strings = [strings].flat();
        this.keys = keys;
    }


    // deno-lint-ignore no-unused-vars
    static escape(value: unknown): string {
        throw new Error("Not implemented");
    }


    abstract render(params: ParamsType): string;


    static renderInContext(ContextClass: typeof ContextedValue, strings: readonly string[], keys: readonly unknown[], params: ParamsType): string {
        return strings.reduce((acc: string[], s, i) => {
            acc.push(s);

            const key = keys.at(i);
            if (key !== undefined) {
                const value = ((v) => {
                    if (v instanceof Expression) return v.render(params);
                    return v;
                })(key);

                if (value instanceof ContextClass) {
                    acc.push(value.render(params));
                } else {
                    acc.push(ContextClass.escape(value));
                }
            }
            return acc;
        }, []).join('');
    }
}


class _ContextedValue extends ContextedValue {
    render(): string {
        throw new Error("Method not implemented.");
    }
}

export type ContextedValueType = typeof _ContextedValue;


export type ContextedTag = {
    // deno-lint-ignore no-explicit-any
    (contents: TemplateStringsArray, ...expressions: any[]): ContextedValue
}
