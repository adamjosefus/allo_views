import { Expression, type ExpressionRenderCallback } from "./expressions/mod.ts";
import { type ParamsType } from "./ParamsType.ts";
import { generateJavascriptVariablesCode } from "./helpers/generateJavascriptVariablesCode.ts";


/**
 * @internal
 */
export class ExpressionsParser {
    static #regex = {
        expressionParser: /\{\{((?<name>\w+)|(\=(?<stringQuote>["']?)(?<inline>.+)\4))(?<callable>\((?<callableArgs>.*)\))?(?<filters>(\|\w+(\:.+)*)*)?\}\}/g,
    }


    parse(source: string) {
        const regex = ExpressionsParser.#regex.expressionParser;
        regex.lastIndex = 0;

        const strings: string[] = [];
        const expressions: Expression[] = [];

        const previous = {
            start: 0,
            end: 0
        }

        let match: RegExpMatchArray | null = null;
        while ((match = regex.exec(source)) !== null) {
            const start = match.index!;
            const end = regex.lastIndex!;

            const { name, stringQuote, inline, callable, callableArgs, _filters } = match.groups ?? {} as Record<string, string | null | undefined>;

            // Set tag
            const renderCallback = ((): ExpressionRenderCallback => {
                // Inline force string value
                if (inline && stringQuote) return ExpressionsParser.#createStringSerializeCallback(inline, stringQuote);

                // Inline value
                if (inline) return ExpressionsParser.#createExpressionSerializeCallback(inline);

                // Variable callable
                if (name && callable) return ExpressionsParser.#createFunctionSerializeCallback(name, callableArgs ?? null);

                // Variable
                if (name) return ExpressionsParser.#createVariableSerializeCallback(name);

                throw new Error("Unknown tag type");
            })();

            const renderSafeCallback = (params: ParamsType) => {
                try {
                    return renderCallback(params);
                } catch (err) {
                    console.log("Expression serialize error:", err);
                    return null;
                }
            }

            const expression = new Expression(renderSafeCallback);

            expressions.push(expression);

            // Set base
            const base = source.substring(previous.end, start);
            strings.push(base);

            // Update to next iteration
            previous.start = start;
            previous.end = end;

        }

        strings.push(source.substring(previous.end));

        return {
            strings,
            expressions
        };
    }



    static #createStringSerializeCallback = (rawString: string, quoteMark: string): ExpressionRenderCallback => {
        return _params => {
            return eval.apply(null, [`${quoteMark}${rawString}${quoteMark}`]);
        }
    }


    static #createExpressionSerializeCallback = (expression: string): ExpressionRenderCallback => {
        return params => {
            const script = `(() => {
            ${generateJavascriptVariablesCode(params)}
            return ${expression};
        })();`;

            return eval.apply(null, [script]);
        }
    }


    static #createVariableSerializeCallback = (paramName: string): ExpressionRenderCallback => {
        return params => {
            const paramStore = new Map(Object.entries(params));
            if (!paramStore.has(paramName)) throw new Error(`Missing parameter: ${paramName}`);

            return paramStore.get(paramName)!;
        }
    }


    static #createFunctionSerializeCallback = (paramName: string, rawArgs: string | null): ExpressionRenderCallback => {
        return params => {
            const paramStore = new Map(Object.entries(params));
            if (!paramStore.has(paramName)) throw new Error(`Missing parameter: ${paramName}`);

            const fce = paramStore.get(paramName) as (...args: unknown[]) => unknown;

            if (rawArgs === null) {
                return fce();
            } else {
                const script = `(() => {
                    ${generateJavascriptVariablesCode(params)}
                    return [${rawArgs}];
                })();`;

                const args = eval.apply(null, [script]) as unknown[];
                return fce(...args);
            }
        }
    }

}
