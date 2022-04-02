import { Expression } from "../expressions/Expression.ts";
import { type ParamsType } from "../ParamsType.ts";
import { type ContextValue } from "./ContextValue.ts";


export function renderInContext(ContextClass: typeof ContextValue, strings: readonly string[], keys: readonly unknown[], params: ParamsType): string {
    return strings.reduce((acc: string[], s, i) => {
        acc.push(s);

        const key = keys.at(i);
        if (key !== undefined) {
            const value = ((v) => {
                if (v instanceof Expression) return v.render(params);
                return v;
            })(key);

            if (value instanceof ContextClass) {
                acc.push(value.render(params));
            } else {
                acc.push(ContextClass.escape(value));
            }
        }
        return acc;
    }, []).join('');
}