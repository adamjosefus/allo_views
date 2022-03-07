/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Context } from "../Context.ts";
import { type Fragment } from "./Fragment.ts";
import { HtmlContentFragment } from "./HtmlContentFragment.ts";
import { JsContentFragment } from "./JsContentFragment.ts";


export const createFragment = (context: Context, bases: string[] | string, values: unknown[] = []): Fragment => {
    switch (context) {
        case Context.HtmlContent:
            return new HtmlContentFragment(bases, values);

        case Context.JsContent:
            return new JsContentFragment(bases, values);

        default:
            throw new Error(`Unknown renderning context "${context}"`);
    }
}
