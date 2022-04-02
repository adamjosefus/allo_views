/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextedValue, type ContextedTag } from "./ContextedValue.ts";
import { ParamsType } from "./ParamsType.ts";


export class JsValue extends ContextedValue {
    
    static escape(value: unknown): string {
        return JSON.stringify(value, null, 4);
    }


    render(params: ParamsType): string {
        return JsValue.renderInContext(JsValue, this.strings, this.keys, params);
    }
}


export const js: ContextedTag = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsValue([...contents], [...expressions]);
}
