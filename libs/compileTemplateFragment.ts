import { Expression, type ExpressionType } from "./expressionTypes.ts";

const tagParser = /\{\{((?<name>\w+)|(\=(?<stringQuote>["']?)(?<inline>.+)\4))(\((?<callable>.*)\))?(?<filters>(\|\w+(\:.+)*)*)?\}\}/g;


function escapeForEval(v: unknown): string {
    if (typeof v === 'number') return v.toString();
    if (typeof v === 'string') return `"${v.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

    return JSON.stringify(v);
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

        const { name, stringQuote, inline, callable, filters } = match.groups ?? {} as Record<string, string | null | undefined>;
        // console.log({ name, string, value, callable, filters });

        // Set tag
        const tag = ((): ExpressionType => {
            // Force string inline value
            if (inline && stringQuote) {
                return {
                    type: Expression.Inline,
                    serialize: (_params) => eval.apply(null, [`${stringQuote}${inline}${stringQuote}`]),
                } as ExpressionType<Expression.Inline>;
            }

            // Inline value
            if (inline) {
                return {
                    type: 'inline',
                    serialize: (params) => {
                        try {
                            const paramArr = Object.entries(params);
                            const script = [
                                `(() => {`,
                                ...paramArr.map(([name, value]) => `const ${name} = ${escapeForEval(value)};`),
                                `return ${inline};`,
                                `})()`,
                            ].join('\n');

                            return eval.apply(null, [script]);
                        } catch (_error) {
                            // TODO: Throw error or something
                            return null;
                        }

                    }
                } as ExpressionType<Expression.Inline>;
            }


            // Variable
            if (name) {
                return {
                    type: 'variable',
                    serialize: (params) => {
                        const paramStore = new Map(Object.entries(params));

                        if (paramStore.has(name)) {
                            return paramStore.get(name)!;
                        } else {
                            // TODO: Throw error or something
                            return null;
                        }
                    },
                    name,
                } as ExpressionType<Expression.Variable>;
            }

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
