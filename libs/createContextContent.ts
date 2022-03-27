/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { RenderingContext } from "./RenderingContext.ts";
import { type ContextContent } from "./ContextContent.ts";
import { HtmlContextContent } from "./HtmlContextContent.ts";
import { JsContextContent } from "./JsContextContent.ts";


export const createContextContent = (context: RenderingContext, bases: string[] | string, values: unknown[] = []): ContextContent => {
    switch (context) {
        case RenderingContext.HtmlContent:
            return new HtmlContextContent(bases, values);

        case RenderingContext.JsContent:
            return new JsContextContent(bases, values);

        case RenderingContext.JsComment:
            // TODO:
            throw new Error("Not implemented.");

        default:
            throw new Error(`Unknown renderning context "${context}"`);
    }
}
