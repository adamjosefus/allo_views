/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextContent, type ContextContentTag } from "./ContextContent.ts";


export class JsContextContent extends ContextContent {
    
    escape(s: unknown): string {
        return JSON.stringify(s, null, 4);
    }


    toString(): string {
        const acc: string[] = [];

        for (let i = 0; i < this.parts.length; i++) {
            const base = this.parts[i];
            acc.push(base);

            if (this.values[i] !== undefined) {
                const value = this.values[i];

                if (value instanceof JsContextContent) {
                    acc.push(value.toString());
                } else {
                    acc.push(this.escape(value));
                }
            }
        }

        return acc.join('');
    }
}


export const js: ContextContentTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsContextContent([...contents], expressions);
}