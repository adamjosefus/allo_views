/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { RenderingContext } from "./RenderingContext.ts";

export abstract class ContextContent {
    protected strings: readonly string[];
    protected keys: readonly unknown[];

    constructor(strings: string[] | string, keys: unknown[] = []) {
        this.strings = [strings].flat();
        this.keys = keys;
    }


    static escape(content: unknown): string {
        throw new Error("Not implemented");
    }


    abstract render(): string;


    static renderInContext(ContextClass: typeof ContextContent, strings: readonly string[], keys: readonly unknown[]): string {
        return strings.reduce((acc: string[], s, i) => {
            acc.push(s);

            const key = keys.at(i);
            if (key !== undefined) {
                if (key instanceof ContextClass) {
                    acc.push(key.render());
                } else {
                    acc.push(ContextClass.escape(key));
                }
            }

            return acc;
        }, []).join('');
    }
}


export type ContextContentTag = {
    // deno-lint-ignore no-explicit-any
    (contents: TemplateStringsArray, ...expressions: any[]): ContextContent
}
