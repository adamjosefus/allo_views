import { type ParamsType } from "./ParamsType.ts";


/**
 * @internal
 */
export type ExpressionType = {
    serialize: (params: ParamsType) => unknown;
}


export type ExpressionRenderCallback = (params: ParamsType) => unknown;


export class Expression {

    readonly #callback: ExpressionRenderCallback;
    
    constructor(callback: ExpressionRenderCallback) {
        this.#callback = callback;
    }


    render(params: ParamsType): unknown {
        return this.#callback(params);
    }
}