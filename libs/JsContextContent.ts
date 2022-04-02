/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextContent, type ContextContentTag } from "./ContextContent.ts";


export class JsContextContent extends ContextContent {
    
    static escape(value: unknown): string {
        return JSON.stringify(value, null, 4);
    }


    render(): string {
        return JsContextContent.renderInContext(JsContextContent, this.strings, this.keys);
    }
}


export const js: ContextContentTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsContextContent([...contents], [...expressions]);
}