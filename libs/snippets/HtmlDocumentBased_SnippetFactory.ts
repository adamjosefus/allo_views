/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { type ISnippetFactory } from "./ISnippetFactory.ts";
import { sliceString } from "../helpers/sliceString.ts";


export const enum ContextType {
    Html = "html",
    HtmlComment = "html-comment",
    Js = "js",
    JsComment = "js-comment",
}


/**
 * @internal
 */
export class SnippetFactory implements ISnippetFactory<ContextType> {

    #regex = {
        htmlScriptTags: /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs,
        javascriptComments: /(?:((["'`])(?:(?:\\\\)|\\\2|(?!\\\2)\\|(?!\2).|[\n\r])*\2)|(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/[^\n\r]*(?:[\n\r]+|$))|((?:=|:)\s*(?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/)[gimy]?\.(?:exec|test|match|search|replace|split)\()|(\.(?:exec|test|match|search|replace|split)\((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|(<!--(?:(?!-->).)*-->))/g,
    }


    create(sourceContent: string) {
        const sliceIndexes = this.#computeSliceIndexes(sourceContent);

        const htmlSnippets = sliceString(sourceContent, [0, ...sliceIndexes]).map(s => this.#createDomSnippets(s));
        const jsSnippets = sliceString(sourceContent, [...sliceIndexes]).map(s => this.#createScriptSnippets(s));

        // Get max length of arrays
        const length = Math.max(htmlSnippets.length, jsSnippets.length);

        // Merge zigzag html and js snippets
        return Array(length).fill(null).map((_blank, i) => {
            const htmlSnippet = htmlSnippets[i] ?? [];
            const jsSnippet = jsSnippets[i] ?? [];

            return [
                htmlSnippet,
                jsSnippet,
            ].flat();
        }).flat();
    }


    #createDomSnippets(source: string) {
        // TODO: Detect html comments

        return [
            SnippetFactory.#createHtmlSnippet(source),
        ];
    }


    #createScriptSnippets(source: string) {
        type ItemType = {
            source: string,
            isComment: boolean,
        }

        const regex = this.#regex.javascriptComments
        regex.lastIndex = 0;

        const items: ItemType[] = [];
        const previous = { start: 0, end: 0 }

        let match: RegExpExecArray | null = null
        while ((match = regex.exec(source)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;

            items.push({
                source: source.substring(previous.end, start),
                isComment: false,
            });

            previous.start = start;
            previous.end = end;

            const isComment = match[2] === undefined;

            items.push({
                source: source.substring(start, end),
                isComment
            });
        }

        // Add last content
        items.push({
            source: source.substring(previous.end),
            isComment: false,
        });

        // Join item with same type
        return items.reduce((acc: ItemType[], currItem) => {
            const prevItem = acc.at(-1);

            if (prevItem && prevItem.isComment === currItem.isComment) prevItem.source += currItem.source
            else acc.push(currItem);

            return acc;
        }, []).map(({ source, isComment }) => {
            if (isComment) {
                return SnippetFactory.#createJsCommentSnippet(source);
            } else {
                return SnippetFactory.#createJsSnippet(source);
            }
        });
    }


    /**
     * Get slice indexes of html and js snippets.
     * 
     * @param sourceContent 
     * @returns 
     */
    #computeSliceIndexes = (sourceContent: string): readonly number[] => {
        const regex = this.#regex.htmlScriptTags;
        regex.lastIndex = 0;

        const slices: number[] = [];

        let match: RegExpExecArray | null = null
        while ((match = regex.exec(sourceContent)) !== null) {
            const { openTag, content, closeTag } = match.groups as Record<string, string>;
            const offset = regex.lastIndex - (openTag.length + content.length + closeTag.length);

            const start = offset + openTag.length;
            const end = start + content.length;

            slices.push(start, end);
        }

        return slices;
    }

    static #createHtmlSnippet(source: string) {
        return {
            context: ContextType.Html,
            source: source,
        }
    }


    static #createHtmlCommentSnippet(source: string) {
        return {
            context: ContextType.HtmlComment,
            source: source,
        }
    }


    static #createJsSnippet(source: string) {
        return {
            context: ContextType.Js,
            source: source,
        }
    }


    static #createJsCommentSnippet(source: string) {
        return {
            context: ContextType.JsComment,
            source: source,
        }
    }
}
