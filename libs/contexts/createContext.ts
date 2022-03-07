/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContextOptions } from "./ContextOptions.ts";
import { type Context } from "./Context.ts";
import { HtmlContentContext } from "./HtmlContentContext.ts";
import { JsContentContext } from "./JsContentContext.ts";


export const createContext = (context: ContextOptions, bases: string[] | string, values: unknown[] = []): Context => {
    switch (context) {
        case ContextOptions.HtmlContent:
            return new HtmlContentContext(bases, values);

        case ContextOptions.JsContent:
            return new JsContentContext(bases, values);

        default:
            throw new Error(`Unknown renderning context "${context}"`);
    }
}
