import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { compileTemplateFragment } from "../libs/compileTemplateFragment.ts";
import { Expression, ExpressionType } from "../libs/expressionTypes.ts";


Deno.test("compileTemplateFragment – inlines", () => {
    const sets: { source: string, expected: [string[], unknown[]] }[] = [
        {
            source: `Before {{="myString"}} After`,
            expected: [
                ["Before ", " After"],
                ["myString"],
            ],
        },
        {
            source: `Before {{="'quoted'"}} After`,
            expected: [
                ["Before ", " After"],
                ["'quoted'"],
            ],
        },
        {
            source: `Before {{="\\"quoted\\""}} After`,
            expected: [
                ["Before ", " After"],
                ['"quoted"'],
            ],
        },
        {
            source: `email{{="\\u0040"}}example.com`,
            expected: [
                ["email", "example.com"],
                ['@'],
            ],
        },
        {
            source: `Before {{=123}} After`,
            expected: [
                ["Before ", " After"],
                [123],
            ],
        },
        {
            source: `Before {{=[1,2,3,]}} After`,
            expected: [
                ["Before ", " After"],
                [
                    [1, 2, 3],
                ],
            ],
        },
    ];

    for (const set of sets) {
        const { source, expected } = set;
        const [bases, expressions] = compileTemplateFragment(source);

        assertEquals(
            [
                bases,
                expressions
                    .filter(x => x.type === "inline")
                    .map(x => x as ExpressionType<Expression.Inline>)
                    .map(({ serialize }) => serialize({}))
            ],
            expected,
        );
    }
});


Deno.test("compileTemplateFragment – inlines & param variables", () => {
    const params: Record<string, unknown> = {
        "number1000": 1000,
    }

    const sets: { source: string, expected: [string[], unknown[]] }[] = [
        {
            source: `Before {{=123 + number1000}} After`,
            expected: [
                ["Before ", " After"],
                [1123],
            ],
        },
    ];

    for (const set of sets) {
        const { source, expected } = set;
        const [bases, expressions] = compileTemplateFragment(source);

        assertEquals(
            [
                bases,
                expressions
                    .filter(x => x.type === "inline")
                    .map(x => x as ExpressionType<Expression.Inline>)
                    .map(({ serialize }) => serialize(params))
            ],
            expected,
        );
    }
});


Deno.test("compileTemplateFragment – variable", () => {
    const params: Record<string, unknown> = {
        "foo": "foo",
    }

    const sets: { source: string, expected: [string[], string[]] }[] = [
        {
            source: `Before {{foo}} After`,
            expected: [
                ["Before ", " After"],
                ["foo"],
            ],
        },
    ];

    for (const set of sets) {
        const { source, expected } = set;
        const [bases, expressions] = compileTemplateFragment(source);

        assertEquals(
            [
                bases,
                expressions
                    .filter(x => x.type === "variable")
                    .map(x => x as ExpressionType<Expression.Variable>)
                    .map(({ serialize }) => serialize(params))
            ],
            expected,
        );
    }
});