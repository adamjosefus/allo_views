/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { EscapeContext } from "./contexts/EscapeContext.ts";
import { type FragmentType } from "./FragmentType.ts";


type SliceType = {
    start: number,
    end: number,
    content: string,
}


/**
 * @internal
 */
export class FragmentsParser {

    readonly #scriptTagParser = /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs;
    readonly #jsCommentParser = /(?:((["'`])(?:(?:\\\\)|\\\2|(?!\\\2)\\|(?!\2).|[\n\r])*\2)|(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/[^\n\r]*(?:[\n\r]+|$))|((?:=|:)\s*(?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/)[gimy]?\.(?:exec|test|match|search|replace|split)\()|(\.(?:exec|test|match|search|replace|split)\((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|(<!--(?:(?!-->).)*-->))/g;


    parse(source: string): FragmentType[] {
        // const firstLine = source.split('\n')[0].trim();
        // TODO: Detect main type of fragment (html, js, json, xml, plaintext, ...)
        return this.#parseHtml(source);
    }


    #parseHtml(source: string): FragmentType[] {
        const computeJsSlices = (source: string): readonly SliceType[] => {
            const slices: SliceType[] = [];

            const parser = this.#scriptTagParser;
            parser.lastIndex = 0;

            let result: RegExpExecArray | null = null
            while ((result = parser.exec(source)) !== null) {
                const { openTag, content, closeTag } = result.groups as Record<string, string>;
                const offset = parser.lastIndex - (openTag.length + content.length + closeTag.length);

                const start = offset + openTag.length;
                const end = start + content.length;

                slices.push({ start, end, content });
            }

            return slices;
        }

        const computeHtmlSlices = (source: string, slicePoints: number[]): readonly SliceType[] => {
            const slices: SliceType[] = [];

            for (let i = 0; i < slicePoints.length; i += 2) {
                const start = slicePoints[i];
                const end = slicePoints[i + 1];

                const content = source.substring(start, end);

                slices.push({ start, end, content });
            }

            return slices;
        }

        const jsSlices = computeJsSlices(source);
        const htmlSlices = computeHtmlSlices(source, [0, ...jsSlices.map(s => [s.start, s.end]).flat()]);

        return htmlSlices.reduce((fragments: FragmentType[], htmlSlice, i) => {
            const jsSlice = jsSlices[i];

            return [
                fragments,
                htmlSlice ? this.#createHtmlFragments(htmlSlice.content) : [],
                jsSlice ? this.#createJsFragments(jsSlice.content) : [],
            ].flat();
        }, []);
    }


    #createHtmlFragments(source: string): FragmentType[] {
        return [{
            escapeContext: EscapeContext.Html,
            source: source,
        }];
    }


    #createJsFragments(source: string): FragmentType[] {
        console.log("source", source);
        
        const regex = this.#jsCommentParser;
        regex.lastIndex = 0;

        type PrefragmentType = {
            comment: boolean,
            source: string,
        }

        const prefragments: PrefragmentType[] = [];

        const previous = {
            start: 0,
            end: 0,
        }

        // Detect comments
        let match: RegExpExecArray | null = null
        while ((match = regex.exec(source)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;

            prefragments.push({
                comment: false,
                source: source.substring(previous.end, start)
            });

            previous.start = start;
            previous.end = end;

            const isComment = match[2] === undefined;

            prefragments.push({
                comment: isComment,
                source: source.substring(start, end)
            });
        }

        prefragments.push({
            comment: false,
            source: source.substring(previous.end)
        });

        const fragments: FragmentType[] = prefragments
            // Join item with same type
            .reduce((acc: PrefragmentType[], curr) => {
                const prev = acc.at(-1)

                if (prev && prev.comment === curr.comment) prev.source += curr.source
                else acc.push(curr);

                return acc;
            }, [])
            // Create fragments
            .map(p => {
                return {
                    escapeContext: p.comment ? EscapeContext.JsComment : EscapeContext.JsScript,
                    source: p.source,
                }
            });

        return fragments;
    }
}
