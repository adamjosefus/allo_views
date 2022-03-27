import { ExpressionType } from "./ExpressionType.ts";
import { ParamsType } from "./ParamsType.ts";

export function renderFragmentContent(bases: string[], expressions: ExpressionType[], params: ParamsType): string {
    return bases.reduce((acc: string[], s, i) => {
        acc.push(s);
        
        const expression = expressions.at(i);

        if (expression) {
            const value = expression.serialize(params);
            acc.push(`${value}`);
        }

        return acc;
    }, []).join('');
}
