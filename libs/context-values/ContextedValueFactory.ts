/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import {
    SnippetFactory as HtmlDocumentBased_SnippetFactory,
    ContextType as HtmlDocumentBased_ContextType,
} from "../snippets/HtmlDocumentBased_SnippetFactory.ts";
import { ExpressionsParser } from "../expressions/ExpressionsParser.ts";
import {
    InstanceContextValue as ContextValue,
    HtmlContextValue,
    HtmlCommentContextValue,
    JsContextValue,
    JsCommentContextValue,
} from "../context-values/mod.ts";


export type SnippetType<Context extends string> = {
    context: Context;
    source: string;
}


/**
 * @internal
 */
export class ContextedValueFactory {

    #expressionsParser: ExpressionsParser;
    #snippetFactories: Readonly<{
        htmlDocumentBased: HtmlDocumentBased_SnippetFactory;
    }>;



    constructor(expressionsParser: ExpressionsParser) {
        this.#expressionsParser = expressionsParser;
        this.#snippetFactories = {
            htmlDocumentBased: new HtmlDocumentBased_SnippetFactory(),
        }
    }


    create(source: string): ContextValue[] {
        // TODO: Detect main type of fragment (html, js, json, xml, plaintext, ...)
        return this.#createFromHtmlDocument(source);
    }


    #createFromHtmlDocument(source: string): ContextValue[] {
        const factory = this.#snippetFactories.htmlDocumentBased;
        const snippets = factory.create(source);

        return snippets.map(sn => {
            const { strings, expressions } = this.#expressionsParser.parse(sn.source);

            switch (sn.context) {
                case HtmlDocumentBased_ContextType.Html: return new HtmlContextValue(strings, expressions);
                case HtmlDocumentBased_ContextType.HtmlComment: return new HtmlCommentContextValue(strings, expressions);
                case HtmlDocumentBased_ContextType.Js: return new JsContextValue(strings, expressions);
                case HtmlDocumentBased_ContextType.JsComment: return new JsCommentContextValue(strings, expressions);
                
                default:
                    throw new Error("Unsupported context");
            }
        });
    }
}

