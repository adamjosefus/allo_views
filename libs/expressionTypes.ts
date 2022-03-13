
/**
 * @internal
 */
export const enum Expression {
    Inline = "inline",
    Variable = "variable",
    CallableVariable = "callableVariable",
}


type InlineSerializeCallback = (params: Record<string, unknown>) => unknown;
type VariableSerializeCallback = (params: Record<string, unknown>) => unknown;
type CallableVariableSerializeCallback = (params: Record<string, unknown>) => unknown;


/**
 * @internal
 */
export type ExpressionType<Ex extends Expression = never> = {
    type: Expression;
    serialize:
        Ex extends Expression.Inline
            ? InlineSerializeCallback
            : (Ex extends Expression.Variable
                ? VariableSerializeCallback
                : (Ex extends Expression.CallableVariable
                    ? CallableVariableSerializeCallback
                    : never));
};
