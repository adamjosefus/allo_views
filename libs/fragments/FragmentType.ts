import { type ParamsType } from "../ParamsType.ts";
// import { type ExpressionType } from "./ExpressionType.ts";


/**
 * @internal
 */
export type FragmentType = {
    // content: [bases: string[], expressions: ExpressionType[]],
    sourceText: string,
    serialize: (params: ParamsType) => string;
}
