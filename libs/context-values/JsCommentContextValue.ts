/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextValue, type ContextTagType } from "./ContextValue.ts";
import { ParamsType } from "../ParamsType.ts";
import { renderInContext } from "./renderInContext.ts";


/* ahoj  ahoj */

export class JsCommentContextValue extends ContextValue {

    static readonly #replacement = new Map<string, string>([
        ['*/', '﹡/'],
        ['/*', '/﹡'],
    ]);


    static escape(value: unknown): string {
        const map = JsCommentContextValue.#replacement;

        let s = `${value}`;
        for (const [interest, replacement] of map) {
            s = s.replaceAll(interest, replacement);
        }

        return s;
    }


    render(params: ParamsType): string {
        return renderInContext(JsCommentContextValue, this.strings, this.values, params);
    }
}


export const jsComment: ContextTagType = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsCommentContextValue([...contents], [...expressions]);
}
