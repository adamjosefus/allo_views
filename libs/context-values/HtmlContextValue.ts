/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextValue, type ContextTagType } from "./ContextValue.ts";
import { ParamsType } from "../ParamsType.ts";
import { renderInContext } from "./renderInContext.ts";


export class HtmlContextValue extends ContextValue {

    static readonly #regex = /[&<>"']/g;

    static readonly #replacement = new Map<string, string>([
        ['&', '&amp;'],
        ['<', '&lt;'],
        ['>', '&gt;'],
        ['"', '&quot;'],
        ["'", '&#39;'],
    ]);


    static escape(value: unknown): string {
        const regex = HtmlContextValue.#regex;
        const replacement = HtmlContextValue.#replacement;

        regex.lastIndex = 0;
        return `${value}`.replace(regex, (match) => {
            if (!replacement.has(match)) {
                throw new Error("Unknown special character");
            }

            return replacement.get(match)!;
        });
    }


    render(params: ParamsType): string {
        return renderInContext(HtmlContextValue, this.strings, this.values, params);
    }
}


export const html: ContextTagType = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new HtmlContextValue([...contents], [...expressions]);
}
