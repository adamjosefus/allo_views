/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { type IDocumentBasedValueFactory } from "./IDocumentBasedValueFactory.ts";
import { sliceContent } from "./sliceContent.ts";

import { HtmlValue } from "./HtmlValue.ts";
import { HtmlCommentValue } from "./HtmlCommentValue.ts";
import { JsValue } from "./JsValue.ts";
import { JsCommentValue } from "./JsCommentValue.ts";
import { ExpressionsParser } from "./ExpressionsParser.ts";


/**
 * TODO: rename
 * @internal
 */
export class HtmlDocumentContextedValueFactory implements IDocumentBasedValueFactory {

    #expressionsParser: ExpressionsParser;

    constructor(expressionsParser: ExpressionsParser) {
        this.#expressionsParser = expressionsParser;
    }


    create(sourceContent: string): (HtmlValue | HtmlCommentValue | JsValue | JsCommentValue)[] {
        const sliceIndexes = this.#computeSliceIndexes(sourceContent);

        const htmlSnippets = sliceContent(sourceContent, [0, ...sliceIndexes]).map(s => this.#createHtmlValues(s));
        const jsSnippets = sliceContent(sourceContent, [...sliceIndexes]).map(s => this.#createJsValues(s));

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


    #regex = {
        htmlScriptTags: /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs,
        javascriptComments: /(?:((["'`])(?:(?:\\\\)|\\\2|(?!\\\2)\\|(?!\2).|[\n\r])*\2)|(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/[^\n\r]*(?:[\n\r]+|$))|((?:=|:)\s*(?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/)[gimy]?\.(?:exec|test|match|search|replace|split)\()|(\.(?:exec|test|match|search|replace|split)\((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|(<!--(?:(?!-->).)*-->))/g,
    }


    #createHtmlValues(source: string): (HtmlValue | HtmlCommentValue)[] {
        // TODO: Detect html comments

        return [
            this.#createHtmlValue(source),
        ];
    }


    #createHtmlValue(source: string): HtmlValue {
        const { bases, expressions } = this.#expressionsParser.parse(source);
        return new HtmlValue(bases, expressions);
    }

    #createJsValue(source: string): HtmlValue {
        const { bases, expressions } = this.#expressionsParser.parse(source);
        return new JsValue(bases, expressions);
    }

    #createJsCommentValue(source: string): HtmlValue {
        const { bases, expressions } = this.#expressionsParser.parse(source);
        return new JsCommentValue(bases, expressions);
    }



    #createJsValues(source: string): (JsValue | JsCommentValue)[] {
        type SnippetType = {
            content: string,
            isComment: boolean,
        }

        const regex = this.#regex.javascriptComments
        regex.lastIndex = 0;

        const snippets: SnippetType[] = [];
        const previous = { start: 0, end: 0 }

        let match: RegExpExecArray | null = null
        while ((match = regex.exec(source)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;

            snippets.push({
                content: source.substring(previous.end, start),
                isComment: false,
            });

            previous.start = start;
            previous.end = end;

            const isComment = match[2] === undefined;

            snippets.push({
                content: source.substring(start, end),
                isComment
            });
        }

        // Add last content
        snippets.push({
            content: source.substring(previous.end),
            isComment: false,
        });

        // Join item with same type
        return snippets.reduce((acc: SnippetType[], curr) => {
            const prev = acc.at(-1)

            if (prev && prev.isComment === curr.isComment) prev.content += curr.content
            else acc.push(curr);

            return acc;
        }, []).map(({ content, isComment }) => {
            if (isComment) {
                return this.#createJsCommentValue(content);
            }

            return this.#createJsValue(content);
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
}
