/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextedValue, type ContextedTag } from "./ContextedValue.ts";


/* ahoj  ahoj */

export class JsCommentValue extends ContextedValue {

    static readonly #replacement = new Map<string, string>([
        ['*/', '﹡/'],
        ['/*', '/﹡'],
    ]);


    static escape(value: unknown): string {
        const map = JsCommentValue.#replacement;

        let s = `${value}`;
        for (const [interest, replacement] of map) {
            s = s.replaceAll(interest, replacement);
        }

        return s;
    }


    render(): string {
        return JsCommentValue.renderInContext(JsCommentValue, this.strings, this.keys);
    }
}


export const jsComment: ContextedTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsCommentValue([...contents], [...expressions]);
}
