/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Context, type ContextTag } from "./Context.ts";


export class HtmlContentContext extends Context {

    #regex = {
        specialChars: /[&<>"']/g,
    }

    escape(s: unknown): string {
        const regex = this.#regex.specialChars;
        const replacement = new Map<string, string>([
            ['&', '&amp;'],
            ['<', '&lt;'],
            ['>', '&gt;'],
            ['"', '&quot;'],
            ["'", '&#39;'],
        ]);

        regex.lastIndex = 0;
        return `${s}`.replace(regex, (match) => {
            if (replacement.has(match)) {
                return replacement.get(match)!;
            }

            throw new Error("Unknown special character");
        });
    }


    toString(): string {
        const acc: string[] = [];

        for (let i = 0; i < this.parts.length; i++) {
            const base = this.parts[i];
            acc.push(base);

            if (this.values[i] !== undefined) {
                const value = this.values[i];

                if (value instanceof HtmlContentContext) {
                    acc.push(value.toString());
                } else {
                    acc.push(this.escape(value));
                }
            }
        }

        return acc.join('');
    }
}


export const html: ContextTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new HtmlContentContext([...contents], expressions);
}
