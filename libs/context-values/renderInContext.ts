import { Expression } from "../expressions/Expression.ts";
import { type ParamsType } from "../ParamsType.ts";
import { type StaticContextValue } from "./CommonContextValue.ts";
import { ContextValue } from "./ContextValue.ts";


/**
 * @internal
 */
export function renderInContext(ContextClass: StaticContextValue, strings: readonly string[], keys: readonly unknown[], params: ParamsType): string {
    return strings.reduce((acc: string[], s, i) => {
        acc.push(s);

        const key = keys.at(i);
        if (key !== undefined) {
            const value = ((v) => {
                if (v instanceof Expression) return v.render(ContextClass, params, new Map());
                return v;
            })(key);

            if (value instanceof ContextClass) {
                acc.push(value.render(params));
            } else if (value instanceof ContextValue) {
                acc.push(ContextClass.escape(value.render(params)));
            } else {
                acc.push(ContextClass.escape(value));
            }
        }
        return acc;
    }, []).join('');
}
