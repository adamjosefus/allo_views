import { type RenderingContext } from "./RenderingContext.ts";


/**
 * @internal
 */
export type ContextFragmentType = {
    readonly renderingContext: RenderingContext,
    sourceContent: string,
}
