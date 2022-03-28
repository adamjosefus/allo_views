/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { HtmlDocumentContextFragmentFactory } from "./HtmlDocumentContextFragmentFactory.ts";
import { type ContextFragmentType } from "./ContextFragmentType.ts";


/**
 * @internal
 */
export class ContextFragmentFactory {

    htmlDocumentFragmentFactory = new HtmlDocumentContextFragmentFactory();

    create(source: string): ContextFragmentType[] {
        // TODO: Detect main type of fragment (html, js, json, xml, plaintext, ...)
        const fragments = this.#createFromHtmlDocument(source);

        return fragments;
    }


    #createFromHtmlDocument(source: string): ContextFragmentType[] {
        return this.htmlDocumentFragmentFactory.create(source);
    }
}

