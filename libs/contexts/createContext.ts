/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { EscapeContext } from "./EscapeContext.ts";
import { type Context } from "./Context.ts";
import { HtmlContentContext } from "./HtmlContentContext.ts";
import { JsContentContext } from "./JsContentContext.ts";


export const createContext = (context: EscapeContext, bases: string[] | string, values: unknown[] = []): Context => {
    switch (context) {
        case EscapeContext.Html:
            return new HtmlContentContext(bases, values);

        case EscapeContext.JsScript:
            return new JsContentContext(bases, values);

        default:
            throw new Error(`Unknown renderning context "${context}"`);
    }
}
