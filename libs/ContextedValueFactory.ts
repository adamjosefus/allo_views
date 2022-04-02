/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { HtmlDocumentContextedValueFactory } from "./HtmlDocumentContextedValueFactory.ts";
import { type ContextFragmentType } from "./ContextFragmentType.ts";
import { IDocumentBasedValueFactory } from "./IDocumentBasedValueFactory.ts";
import { ExpressionsParser } from "./ExpressionsParser.ts";
import { ContextValue } from "./context-values/ContextValue.ts";


/**
 * @internal
 */
export class ContextedValueFactory implements IDocumentBasedValueFactory {

    #htmlBasedFactory: HtmlDocumentContextedValueFactory;

    constructor(expressionsParser: ExpressionsParser) {
        this.#htmlBasedFactory = new HtmlDocumentContextedValueFactory(expressionsParser);
    }


    create(source: string): ContextValue[] {
        // TODO: Detect main type of fragment (html, js, json, xml, plaintext, ...)
        return this.#createFromHtmlDocument(source);
    }


    #createFromHtmlDocument(source: string): ContextValue[] {
        return this.#htmlBasedFactory.create(source);
    }
}

