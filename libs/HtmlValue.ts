/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextedValue, type ContextedTag } from "./ContextedValue.ts";
import { ParamsType } from "./ParamsType.ts";


export class HtmlValue extends ContextedValue {

    static readonly #regex = /[&<>"']/g;

    static readonly #replacement = new Map<string, string>([
        ['&', '&amp;'],
        ['<', '&lt;'],
        ['>', '&gt;'],
        ['"', '&quot;'],
        ["'", '&#39;'],
    ]);


    static escape(value: unknown): string {
        const regex = HtmlValue.#regex;
        const replacement = HtmlValue.#replacement;

        regex.lastIndex = 0;
        return `${value}`.replace(regex, (match) => {
            if (!replacement.has(match)) {
                throw new Error("Unknown special character");
            }

            return replacement.get(match)!;
        });
    }


    render(params: ParamsType): string {
        return HtmlValue.renderInContext(HtmlValue, this.strings, this.keys, params);
    }
}


export const html: ContextedTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new HtmlValue([...contents], [...expressions]);
}
