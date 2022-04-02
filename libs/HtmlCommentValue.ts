/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextedValue, type ContextedTag } from "./ContextedValue.ts";
import { ParamsType } from "./ParamsType.ts";


export class HtmlCommentValue extends ContextedValue {
    static readonly #replacementMap = new Map<string, string>([
        ['<!--', '<!——'],
        ['-->', '——>'],
    ]);


    static escape(value: unknown): string {
        const map = HtmlCommentValue.#replacementMap;

        let s = `${value}`;
        for (const [interest, replacement] of map) {
            s = s.replaceAll(interest, replacement);
        }

        return s;
    }


    render(params: ParamsType): string {
        return HtmlCommentValue.renderInContext(HtmlCommentValue, this.strings, this.keys, params);
    }
}


export const htmlComment: ContextedTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new HtmlCommentValue([...contents], [...expressions]);
}
