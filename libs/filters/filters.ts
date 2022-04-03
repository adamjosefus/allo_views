/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Marked as Markdown } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import {
    type StaticContextValue,
    type InstanceContextValue,
    JsContextValue,
    HtmlContextValue,
} from "./context-values/mod.ts";


export type FilterType<T = unknown> = (ctx: StaticContextValue, content: T) => InstanceContextValue | unknown;


export const noescape: FilterType<string> = (ctx, content: string) => {
    return ctx.escape(new ctx(content));
};


export const json: FilterType<unknown> = (_ctx, content) => {
    return JsContextValue.escape(new JsContextValue(JSON.stringify(content)))
};


export const markdown: FilterType<string> = (_ctx, s) => {
    return HtmlContextValue.escape(new HtmlContextValue(Markdown.parse(s).content))
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
