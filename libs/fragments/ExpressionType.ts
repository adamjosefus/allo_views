import { type ParamsType } from "../ParamsType.ts";


/**
 * @internal
 */
export type ExpressionType = {
    serialize: (params: ParamsType) => unknown;
}