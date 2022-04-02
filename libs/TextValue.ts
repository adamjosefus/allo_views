/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextedValue, type ContextedTag } from "./ContextedValue.ts";


export class TextValue extends ContextedValue {

    static escape(value: unknown): string {
        return `${value}`;
    }


    render(): string {
        return TextValue.renderInContext(TextValue, this.strings, this.keys);
    }
}


export const text: ContextedTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new TextValue([...contents], [...expressions]);
}
