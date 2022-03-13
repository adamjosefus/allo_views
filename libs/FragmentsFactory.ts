/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { EscapeContext } from "./contexts/EscapeContext.ts";
import { type FragmentType } from "./FragmentType.ts";


// type SliceType = {
//     start: number,
//     end: number,
//     content: string,
// }


/**
 * @internal
 */
export class FragmentsFactory {

    readonly #scriptTagParser = /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs;
    readonly #jsCommentParser = /(?:((["'`])(?:(?:\\\\)|\\\2|(?!\\\2)\\|(?!\2).|[\n\r])*\2)|(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/[^\n\r]*(?:[\n\r]+|$))|((?:=|:)\s*(?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/)[gimy]?\.(?:exec|test|match|search|replace|split)\()|(\.(?:exec|test|match|search|replace|split)\((?:\/(?:(?:(?!\\*\/).)|\\\\|\\\/|[^\\]\[(?:\\\\|\\\]|[^]])+\])+\/))|(<!--(?:(?!-->).)*-->))/g;


    create(source: string): FragmentType[] {
        // const firstLine = source.split('\n')[0].trim();
        // TODO: Detect main type of fragment (html, js, json, xml, plaintext, ...)
        return this.#createFromHtmlOrigin(source);
    }


    #createFromHtmlOrigin(source: string): FragmentType[] {
        type SliceType = {
            start: number,
            end: number,
            content: string,
        }

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
            sourceContent: source,
        }];
    }


    #createJsFragments(source: string): FragmentType[] {
        const regex = this.#jsCommentParser;
        regex.lastIndex = 0;

        type PrefragmentType = {
            type: 'script' | 'comment',
            sourceContent: string,
        }

        const prefragments: PrefragmentType[] = [];
        const previous = { start: 0, end: 0 }

        // Detect comments
        let match: RegExpExecArray | null = null
        while ((match = regex.exec(source)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;

            prefragments.push({
                type: 'script',
                sourceContent: source.substring(previous.end, start)
            });

            previous.start = start;
            previous.end = end;

            const commentToggle = match[2] === undefined;

            prefragments.push({
                type: commentToggle ? 'comment' : 'script',
                sourceContent: source.substring(start, end)
            });
        }

        prefragments.push({
            type: 'script',
            sourceContent: source.substring(previous.end)
        });

        const fragments: FragmentType[] = prefragments
            // Join item with same type
            .reduce((acc: PrefragmentType[], curr) => {
                const prev = acc.at(-1)

                if (prev && prev.type === curr.type) prev.sourceContent += curr.sourceContent
                else acc.push(curr);

                return acc;
            }, [])
            // Create fragments
            .map(p => {
                const escapeContext = ((t) => {
                    switch (t) {
                        case 'script': return EscapeContext.JsScript;
                        case 'comment': return EscapeContext.JsComment;

                        default: throw new Error("Unknown type: " + t);
                    }
                })(p.type);

                return {
                    escapeContext: escapeContext,
                    sourceContent: p.sourceContent,
                }
            });

        return fragments;
    }
}
