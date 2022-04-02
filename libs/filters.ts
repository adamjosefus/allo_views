/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Marked as Markdown } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { RenderingContext } from "./RenderingContext.ts";
import { type ContextedValueType, ContextedValue } from "./ContextedValue.ts";
import { JsValue } from "./JsValue.ts";
import { HtmlValue } from "./HtmlValue.ts";

export type FilterType<T = unknown> = (ctx: ContextedValueType, content: T) => ContextedValue | string;


export const noescape: FilterType<string> = (ctx, content: string) => {
    return ctx.escape(new ctx(content));
};


export const json: FilterType<unknown> = (_ctx, content) => {
    return JsValue.escape(new JsValue(JSON.stringify(content)))
};


export const markdown: FilterType<string> = (_ctx, s) => {
    return HtmlValue.escape(new JsValue(Markdown.parse(s).content))
}


export const trim: FilterType<string> = (_ctx, s) => {
    return s.trim();
}


export const lower: FilterType<string> = (_ctx, s) => {
    return s.toLowerCase();
}


export const upper: FilterType<string> = (_ctx, s) => {
    return s.toUpperCase();
}


export const firstUpper: FilterType<string> = (_ctx, s) => {
    return s.substring(0, 1).toUpperCase() + s.substring(1);
}
