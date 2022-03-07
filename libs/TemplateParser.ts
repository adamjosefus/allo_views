/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import {
    type TemplateFragment,
    HtmlContentFragment,
    HtmlCommentFragment,
    JsContentFragment,
    JsCommentFragment,
} from "./fragments/mod.ts";


type SliceType = {
    start: number,
    end: number,
    content: string,
}


export class TemplateParser {

    readonly #scriptTagParser = /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs;
    readonly #jsCommentParser = /(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/g;


    parse(source: string): readonly TemplateFragment[] {
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

        return htmlSlices.reduce((fragments: TemplateFragment[], htmlSlice, i) => {
            const jsSlice = jsSlices[i] as SliceType | undefined;

            return [
                fragments,
                this.#createHtmlFragments(htmlSlice),
                jsSlice ? this.#createJsFragments(jsSlice) : [],
            ].flat();
        }, []);
    }


    #createHtmlFragments(_slice: SliceType): (HtmlContentFragment | HtmlCommentFragment)[] {
        throw new Error("Method not implemented.");
    }


    #createJsFragments(_slice: SliceType): (JsContentFragment | JsCommentFragment)[] {
        throw new Error("Method not implemented.");
    }
}
