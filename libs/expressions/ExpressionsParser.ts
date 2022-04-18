import { generateJavascriptVariablesCode } from "../helpers/generateJavascriptVariablesCode.ts";
import { type ParamsType } from "../ParamsType.ts";
import { Expression, type ExpressionRenderCallback } from "./mod.ts";


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

            const { name, stringQuote, inline, callable, callableArgs, filters } = match.groups ?? {} as Record<string, string | null | undefined>;

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

            if (filters) {
                const arr = ExpressionsParser.#parseFilterString(filters);

                arr.forEach(({ name, getArguments }) => {
                    expression.assignFilter(name, getArguments);
                });
            }

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
            return ExpressionsParser.#parseRawArgs(expression, params);
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
                const args = ExpressionsParser.#parseRawArgs(rawArgs, params);

                return fce(...args);
            }
        }
    }


    static #parseFilterString(s: string) {
        const filters = s.split("|")
            .map(part => part.trim())
            .filter(part => part.length > 0)
            .map(part => {
                const splitIndex = part.indexOf(":");

                if (splitIndex === -1) {
                    return { name: part, rawArgs: null };
                }

                const name = part.substring(0, splitIndex);
                const rawArgs = part.substring(splitIndex + 1);

                return { name, rawArgs };
            })
            .map(({ name, rawArgs }) => {
                const getArguments = (params: ParamsType) => {
                    if (rawArgs === null) return [];
                    return ExpressionsParser.#parseRawArgs(rawArgs, params);
                }

                return { name, getArguments };
            });

        return filters;
    }


    static #parseRawArgs(raw: string, params: ParamsType): unknown[] {
        const script = `(() => {
            ${generateJavascriptVariablesCode(params)}
            return [${raw}];
        })();`;

        return eval.apply(null, [script]) as unknown[];
    }
}
