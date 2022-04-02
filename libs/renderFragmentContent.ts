import { ContextedValue } from "./ContextedValue.ts";
import { type ExpressionType } from "./ExpressionType.ts";
import { HtmlValue } from "./HtmlValue.ts";
import { JsValue } from "./JsValue.ts";
import { type ParamsType } from "./ParamsType.ts";
import { RenderingContext } from "./RenderingContext.ts";


export function renderFragmentContent(renderingContext: RenderingContext, bases: string[], expressions: ExpressionType[], params: ParamsType): string {
    return bases.reduce((acc: string[], s, i) => {
        acc.push(s);

        const expression = expressions.at(i);
        if (expression) {
            const value = expression.serialize(params);

            acc.push(escape(renderingContext, value));
        }

        return acc;
    }, []).join('');
}


function detectRenderingContext(value: unknown): typeof ContextedValue | null {
    if (value instanceof HtmlValue)
        return HtmlValue;

    if (value instanceof JsValue)
        return JsValue;

    return null;
}


function escape(baseContext: RenderingContext, value: unknown): string {
    const context = detectRenderingContext(value);

    if (context) {
        return context.escape(value);
    }

    return "value";
}
