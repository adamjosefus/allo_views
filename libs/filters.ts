/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Marked as Markdown } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { type ContentFragment } from "./ContentFragment.ts";
import { Context } from "./Context.ts";
import { createContentFragment } from "./createContentFragment.ts";


export type FilterType<T = unknown> = (ctx: Context, content: T) => ContentFragment | string;


export const noescape: FilterType<string> = (ctx, content: string) => {
    return createContentFragment(ctx, content);
};


export const json: FilterType<unknown> = (_ctx, content) => {
    return createContentFragment(Context.JS, JSON.stringify(content));
};


export const markdown: FilterType<string> = (_ctx, s) => {
    return createContentFragment(Context.HTML, Markdown.parse(s).content);
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
