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


    #createFromHtmlOrigin(sourceContent: string): FragmentType[] {
        type SliceType = {
            start: number,
            end: number,
            content: string,
        }


        const computeSliceIndexes = (sourceContent: string): readonly number[] => {
            const slices: number[] = [];

            const parser = this.#scriptTagParser;
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
        };


        const getSlices = (sourceContent: string, sliceIndexes: readonly number[]): readonly string[] => {
            const arr: string[] = [];

            for (let i = 0; i < sliceIndexes.length; i += 2) {
                const [start, end] = sliceIndexes.slice(i, i + 1);
                const slice = sourceContent.slice(start, end);

                arr.push(slice);
            }

            return arr;
        }

        const sliceIndexes = computeSliceIndexes(sourceContent);
        const htmlSlices = getSlices(sourceContent, [0, ...sliceIndexes]);
        const jsSlices = getSlices(sourceContent, [...sliceIndexes]);

        return htmlSlices.map((v, i) => {
            const html: string | null = v ?? null;
            const js: string | null = jsSlices[i] ?? null;

            return [
                html ? this.#createHtmlFragments(html) : [],
                js ? this.#createJsFragments(js) : [],
            ].flat();
        }).flat();
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
