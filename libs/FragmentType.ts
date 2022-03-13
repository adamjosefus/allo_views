/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { EscapeContext } from "./contexts/EscapeContext.ts";


/**
 * @internal
 */
export type FragmentType = {
    escapeContext: EscapeContext,
    source: string,
}
