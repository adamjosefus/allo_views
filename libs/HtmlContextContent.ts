/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextContent, type ContextContentTag } from "./ContextContent.ts";


export class HtmlContextContent extends ContextContent {

    static readonly #regex = /[&<>"']/g;

    static readonly #replacement = new Map<string, string>([
        ['&', '&amp;'],
        ['<', '&lt;'],
        ['>', '&gt;'],
        ['"', '&quot;'],
        ["'", '&#39;'],
    ]);


    static escape(value: unknown): string {
        const regex = HtmlContextContent.#regex;
        const replacement = HtmlContextContent.#replacement;

        regex.lastIndex = 0;
        return `${value}`.replace(regex, (match) => {
            if (!replacement.has(match)) {
                throw new Error("Unknown special character");
            }

            return replacement.get(match)!;
        });
    }


    render(): string {
        return HtmlContextContent.renderInContext(HtmlContextContent, this.strings, this.keys);
    }
}


export const html: ContextContentTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new HtmlContextContent([...contents], [...expressions]);
}
