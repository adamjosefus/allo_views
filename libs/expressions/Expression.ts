import { type ExpressionRenderCallback } from "./ExpressionRenderCallback.ts";
import { type ParamsType } from "../ParamsType.ts";


/**
 * @internal
 */
export class Expression {

    readonly #callback: ExpressionRenderCallback;
    
    constructor(callback: ExpressionRenderCallback) {
        this.#callback = callback;
    }


    render(params: ParamsType): unknown {
        return this.#callback(params);
    }
}