/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextValue, type ContextTagType } from "./ContextValue.ts";
import { ParamsType } from "../ParamsType.ts";
import { renderInContext } from "./renderInContext.ts";


export class JsContextValue extends ContextValue {
    
    static escape(value: unknown): string {
        return JSON.stringify(value, null, 4);
    }


    render(params: ParamsType): string {
        return renderInContext(JsContextValue, this.strings, this.values, params);
    }
}


export const js: ContextTagType = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new JsContextValue([...contents], [...expressions]);
}
