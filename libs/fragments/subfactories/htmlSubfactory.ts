/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { EscapeContext } from "../../contexts/EscapeContext.ts";
import { type FragmentType } from "../FragmentType.ts";
import { sliceContent } from "../sliceContent.ts";


type SnippetType = {
    context: EscapeContext,
    content: string,
}


const regex = {
    htmlScriptTags: /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs,
    javascriptComments: /(?:((["'`])(?:(?:\\\\)|\\\2|(?!\\\2)\\|(?!\2).|[\n\r])*\2)|(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/[^\n\r]*(?:[\n\r]+|$))|((?:=|:)\s*(?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/)[gimy]?\.(?:exec|test|match|search|replace|split)\()|(\.(?:exec|test|match|search|replace|split)\((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|(<!--(?:(?!-->).)*-->))/g,
}


/**
 * @internal
 */
export function create(sourceContent: string): FragmentType[] {
    return createSnippets(sourceContent);
}


function createSnippets(sourceContent: string): SnippetType[] {
    const sliceIndexes = computeSliceIndexes(sourceContent);

    const htmlSnippets = sliceContent(sourceContent, [0, ...sliceIndexes]).map(s => createHtmlSnippets(s));
    const jsSnippets = sliceContent(sourceContent, [...sliceIndexes]).map(s => createScriptSnippets(s));

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


function createHtmlSnippets(source: string): SnippetType[] {
    return [
        {
            context: EscapeContext.HtmlContent,
            content: source
        }
    ];
}


function createScriptSnippets(source: string): SnippetType[] {
    const parser = regex.javascriptComments
    parser.lastIndex = 0;

    const snippets: SnippetType[] = [];
    const previous = { start: 0, end: 0 }

    let match: RegExpExecArray | null = null
    while ((match = parser.exec(source)) !== null) {
        const start = match.index;
        const end = parser.lastIndex;

        snippets.push({
            context: EscapeContext.ScriptContent,
            content: source.substring(previous.end, start)
        });

        previous.start = start;
        previous.end = end;

        const isComment = match[2] === undefined;

        snippets.push({
            context: !isComment ? EscapeContext.ScriptContent : EscapeContext.ScriptComment,
            content: source.substring(start, end)
        });
    }

    // Add last content
    snippets.push({
        context: EscapeContext.ScriptContent,
        content: source.substring(previous.end)
    });


    // Join item with same type
    return snippets.reduce((acc: SnippetType[], curr) => {
        const prev = acc.at(-1)

        if (prev && prev.context === curr.context) prev.content += curr.content
        else acc.push(curr);

        return acc;
    }, []);
}


/**
 * Get indexes represent slice different context type.
 */
const computeSliceIndexes = (sourceContent: string): readonly number[] => {
    const slices: number[] = [];

    const parser = regex.htmlScriptTags;
    parser.lastIndex = 0;

    let match: RegExpExecArray | null = null
    while ((match = parser.exec(sourceContent)) !== null) {
        const { openTag, content, closeTag } = match.groups as Record<string, string>;
        const offset = parser.lastIndex - (openTag.length + content.length + closeTag.length);

        const start = offset + openTag.length;
        const end = start + content.length;

        slices.push(start, end);
    }

    return slices;
}
