/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextValue, type ContextTagType } from "./ContextValue.ts";
import { ParamsType } from "../ParamsType.ts";
import { renderInContext } from "./renderInContext.ts";


export class PlainTextContextValue extends ContextValue {

    static escape(value: unknown): string {
        return `${value}`;
    }


    render(params: ParamsType): string {
        return renderInContext(PlainTextContextValue, this.strings, this.values, params);
    }
}


export const text: ContextTagType = (contents: TemplateStringsArray, ...expressions: unknown[]) => {
    return new PlainTextContextValue([...contents], [...expressions]);
}
