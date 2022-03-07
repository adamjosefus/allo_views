/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Context, type ContextTag } from "./Context.ts";


export class JsContentContext extends Context {
    
    escape(s: unknown): string {
        return JSON.stringify(s);
    }


    toString(): string {
        const acc: string[] = [];

        for (let i = 0; i < this.parts.length; i++) {
            const base = this.parts[i];
            acc.push(base);

            if (this.values[i] !== undefined) {
                const value = this.values[i];

                if (value instanceof JsContentContext) {
                    acc.push(value.toString());
                } else {
                    acc.push(this.escape(value));
                }
            }
        }

        return acc.join('');
    }
}


export const js: ContextTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsContentContext([...contents], expressions);
}