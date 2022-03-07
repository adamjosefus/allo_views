/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


type SliceType = {
    start: number,
    end: number,
    content: string,
}

export class TemplateParser {
    static readonly #scriptTagParser = /(?<openTag>\<script.*?\>)(?<content>.*?)(?<closeTag><\/script>)/gs;
    static readonly #jsCommentParser = /(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/g;

    static parse(content: string) {

    }


    static #sliceScriptTags(content: string): readonly SliceType[] {
        const slices: SliceType[] = [];

        const parser = TemplateParser.#scriptTagParser;
        parser.lastIndex = 0;

        let result: RegExpExecArray | null = null
        while ((result = parser.exec(content)) !== null) {
            const { openTag, inner, closeTag } = result.groups as Record<string, string>;
            const offset = parser.lastIndex - (openTag.length + inner.length + closeTag.length);

            const start = offset + openTag.length;
            const end = start + inner.length;

            slices.push({
                start,
                end,
                content: inner
            });
        }

        return slices;
    }
}
