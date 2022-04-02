/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextContent, type ContextContentTag } from "./ContextContent.ts";


/* ahoj  ahoj */

export class JsCommentContextContent extends ContextContent {

    static readonly #replacement = new Map<string, string>([
        ['*/', '﹡/'],
        ['/*', '/﹡'],
    ]);


    static escape(value: unknown): string {
        const map = JsCommentContextContent.#replacement;

        let s = `${value}`;
        for (const [interest, replacement] of map) {
            s = s.replaceAll(interest, replacement);
        }

        return s;
    }


    render(): string {
        return JsCommentContextContent.renderInContext(JsCommentContextContent, this.strings, this.keys);
    }
}


export const jsComment: ContextContentTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsCommentContextContent([...contents], [...expressions]);
}
