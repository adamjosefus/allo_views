import { Expression, type ExpressionType } from "./expressionTypes.ts";

const tagParser = /\{\{((?<name>\w+)|(\=(?<stringQuote>["']?)(?<inline>.+)\4))(?<callable>\((?<callableArgs>.*)\))?(?<filters>(\|\w+(\:.+)*)*)?\}\}/g;


function evalEscape(v: unknown): string {
    if (typeof v === 'function') return v.toString();
    if (typeof v === 'number') return v.toString();
    if (typeof v === 'string') return `"${v.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

    return JSON.stringify(v);
}


function generateJavascriptVariables(params: Record<string, unknown>): string {
    const paramArr = Object.entries(params);

    const variables = paramArr.filter(([_name, value]) => {
        return typeof value !== 'function';
    });

    const functions = paramArr.filter(([_name, value]) => {
        return typeof value === 'function';
    }) as [string, (...args: unknown[]) => unknown][];


    return [...variables, ...functions]
        .map(([name, value]) => `const ${name} = ${evalEscape(value)};`)
        .join('\n');
}


function createStringExpression(inline: string, quoteMark: string): ExpressionType<Expression.Inline> {
    const serialize = () => {
        return eval.apply(null, [`${quoteMark}${inline}${quoteMark}`]);
    }

    return {
        type: Expression.Inline,
        serialize: (_params) => {
            // TODO: Throw error or something
            try {
                return serialize();
            } catch (_error) {
                return null;
            }
        }
    };
}


function createInlineExpression(inline: string): ExpressionType<Expression.Inline> {
    const serialize = (params: Record<string, unknown>) => {
        const script = `(() => {
            ${generateJavascriptVariables(params)}
            return ${inline};
        })();`;

        return eval.apply(null, [script]);
    }

    return {
        type: Expression.Inline,
        serialize: (params) => {
            // TODO: Throw error or something
            try {
                return serialize(params);
            } catch (_error) {
                return null;
            }
        }
    };
}


function createVariableExpression(name: string): ExpressionType<Expression.Variable> {
    const serialize = (params: Record<string, unknown>) => {
        const paramStore = new Map(Object.entries(params));
        if (!paramStore.has(name)) throw new Error(`Missing parameter: ${name}`);

        return paramStore.get(name)!;
    }

    return {
        type: Expression.Variable,
        serialize: (params) => {
            // TODO: Throw error or something
            try {
                return serialize(params);
            } catch (_error) {
                return null;
            }
        }
    };
}


function createFunctionExpression(name: string, rawArgs: string | null): ExpressionType<Expression.CallableVariable> {
    const serialize = (params: Record<string, unknown>) => {
        const paramStore = new Map(Object.entries(params));
        if (!paramStore.has(name)) throw new Error(`Missing parameter: ${name}`);

        const fce = paramStore.get(name) as (...args: unknown[]) => unknown;

        if (rawArgs === null) {
            return fce();
        } else {
            const script = `(() => {
                ${generateJavascriptVariables(params)}
                return [${rawArgs}];
            })();`;

            const args = eval.apply(null, [script]) as unknown[];
            return fce(...args);
        }
    }

    return {
        type: Expression.CallableVariable,
        serialize: (params) => {
            // TODO: Throw error or something
            try {
                return serialize(params);
            } catch (_error) {
                return null;
            }
        }
    };
}



export function compileTemplateFragment(source: string): [bases: string[], expressions: ExpressionType[]] {
    tagParser.lastIndex = 0;
    const regex = tagParser;

    const bases: string[] = [];
    const expressions: ExpressionType[] = [];

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
        const tag = ((): ExpressionType => {
            // Inline force string value
            if (inline && stringQuote) return createStringExpression(inline, stringQuote);

            // Inline value
            if (inline) return createInlineExpression(inline);

            // Variable callable
            if (name && callable) return createFunctionExpression(name, callableArgs ?? null);

            // Variable
            if (name) return createVariableExpression(name);

            throw new Error("Unknown tag type");
        })();

        expressions.push(tag);

        // Set base
        const base = source.substring(previous.end, start);
        bases.push(base);

        // Update to next iteration
        previous.start = start;
        previous.end = end;

    }

    bases.push(source.substring(previous.end));

    return [bases, expressions];
}
