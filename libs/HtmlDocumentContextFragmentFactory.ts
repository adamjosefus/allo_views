/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { type ContextFragmentType } from "./ContextFragmentType.ts";
import { RenderingContext } from "./RenderingContext.ts";
import { type IContextFragmentFactory } from "./IContextFragmentFactory.ts";
import { sliceContent } from "./sliceContent.ts";


/**
 * @internal
 */
export class HtmlDocumentContextFragmentFactory implements IContextFragmentFactory {

    create(sourceContent: string): ContextFragmentType[] {
        const sliceIndexes = HtmlDocumentContextFragmentFactory.#computeSliceIndexes(sourceContent);

        const htmlSnippets = sliceContent(sourceContent, [0, ...sliceIndexes]).map(s => HtmlDocumentContextFragmentFactory.#createHtmlSnippets(s));
        const jsSnippets = sliceContent(sourceContent, [...sliceIndexes]).map(s => HtmlDocumentContextFragmentFactory.#createJsSnippets(s));

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


    static #regex = {
        htmlScriptTags: /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs,
        javascriptComments: /(?:((["'`])(?:(?:\\\\)|\\\2|(?!\\\2)\\|(?!\2).|[\n\r])*\2)|(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/[^\n\r]*(?:[\n\r]+|$))|((?:=|:)\s*(?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/)[gimy]?\.(?:exec|test|match|search|replace|split)\()|(\.(?:exec|test|match|search|replace|split)\((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|(<!--(?:(?!-->).)*-->))/g,
    }


    static #computeSliceIndexes = (sourceContent: string): readonly number[] => {
        const regex = HtmlDocumentContextFragmentFactory.#regex.htmlScriptTags;
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


    static #createHtmlSnippets(source: string): ContextFragmentType[] {
        return [
            {
                renderingContext: RenderingContext.HtmlContent,
                sourceContent: source
            }
        ];
    }


    static #createJsSnippets(source: string): ContextFragmentType[] {
        const regex = HtmlDocumentContextFragmentFactory.#regex.javascriptComments
        regex.lastIndex = 0;

        const snippets: ContextFragmentType[] = [];
        const previous = { start: 0, end: 0 }

        let match: RegExpExecArray | null = null
        while ((match = regex.exec(source)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;

            snippets.push({
                renderingContext: RenderingContext.JsContent,
                sourceContent: source.substring(previous.end, start)
            });

            previous.start = start;
            previous.end = end;

            const isComment = match[2] === undefined;

            snippets.push({
                renderingContext: !isComment ? RenderingContext.JsContent : RenderingContext.JsComment,
                sourceContent: source.substring(start, end)
            });
        }

        // Add last content
        snippets.push({
            renderingContext: RenderingContext.JsContent,
            sourceContent: source.substring(previous.end)
        });

        // Join item with same type
        return snippets.reduce((acc: ContextFragmentType[], curr) => {
            const prev = acc.at(-1)

            if (prev && prev.renderingContext === curr.renderingContext) prev.sourceContent += curr.sourceContent
            else acc.push(curr);

            return acc;
        }, []);
    }
}
