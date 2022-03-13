/**
 * @internal
 */
export const enum Expression {
    Inline = "inline",
    Variable = "variable",
    CallableVariable = "callableVariable",
}


/**
 * @internal
 */
export type ExpressionType<Ex extends Expression | unknown = unknown> = {
    type: Ex,
    serialize: (params: Record<string, unknown>) => unknown,
};
