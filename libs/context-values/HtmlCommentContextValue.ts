/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextValue, type ContextTagType } from "./ContextValue.ts";
import { ParamsType } from "../ParamsType.ts";
import { renderInContext } from "./renderInContext.ts";


export class HtmlCommentContextValue extends ContextValue {
    static readonly #replacementMap = new Map<string, string>([
        ['<!--', '<!——'],
        ['-->', '——>'],
    ]);


    static escape(value: unknown): string {
        const map = HtmlCommentContextValue.#replacementMap;

        let s = `${value}`;
        for (const [interest, replacement] of map) {
            s = s.replaceAll(interest, replacement);
        }

        return s;
    }


    render(params: ParamsType): string {
        return renderInContext(HtmlCommentContextValue, this.strings, this.values, params);
    }
}


export const htmlComment: ContextTagType = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new HtmlCommentContextValue([...contents], [...expressions]);
}
