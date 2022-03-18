/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { type FragmentType } from "./FragmentType.ts";
import * as htmlSubfactory from "./subfactories/htmlSubfactory.ts";


/**
 * @internal
 */
export function create(source: string): FragmentType[] {
    // TODO: Detect main type of fragment (html, js, json, xml, plaintext, ...)
    return htmlSubfactory.create(source);
}
