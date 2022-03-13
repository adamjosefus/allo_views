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
                    .filter(x => x.type === Expression.Inline)
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
        "get1000": () => 1000,
    }

    const sets: { source: string, expected: [string[], unknown[]] }[] = [
        {
            source: `Before {{=123 + number1000}} After`,
            expected: [
                ["Before ", " After"],
                [1123],
            ],
        },
        {
            source: `Before {{=123 + get1000()}} After`,
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
                    .filter(x => x.type === Expression.Inline)
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
        "yes": true,
        "no": false,
        "number1": 123,
        "number2": 123.456,
        "number3": 123_456,
        "arr": ["foo", "bar", 1, 2, true, false],
    }

    const sets: { source: string, expected: [string[], unknown[]] }[] = [
        {
            source: `Before {{foo}} After`,
            expected: [
                ["Before ", " After"],
                ["foo"],
            ],
        },
        {
            source: `Before {{yes}} After`,
            expected: [
                ["Before ", " After"],
                [true],
            ],
        },
        {
            source: `Before {{no}} After`,
            expected: [
                ["Before ", " After"],
                [false],
            ],
        },
        {
            source: `Before {{number1}} After`,
            expected: [
                ["Before ", " After"],
                [123],
            ],
        },
        {
            source: `Before {{number2}} After`,
            expected: [
                ["Before ", " After"],
                [123.456],
            ],
        },
        {
            source: `Before {{number3}} After`,
            expected: [
                ["Before ", " After"],
                [123_456],
            ],
        },

        {
            source: `AA {{number1}} BB {{number2}} CC {{number3}} DD`,
            expected: [
                ["AA ", " BB ", " CC ", " DD"],
                [123, 123.456, 123_456],
            ],
        },

        {
            source: `Before {{arr}} After`,
            expected: [
                ["Before ", " After"],
                [["foo", "bar", 1, 2, true, false]],
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
                    .filter(x => x.type === Expression.Variable)
                    .map(x => x as ExpressionType<Expression.Variable>)
                    .map(({ serialize }) => serialize(params))
            ],
            expected,
        );
    }
});


Deno.test("compileTemplateFragment – variable calleble", () => {
    const params: Record<string, unknown> = {
        "fce1": () => "Function 1",
        "foo": "foo",
        "upper": (s?: string) => (s ?? '').toUpperCase(),
    }

    const sets: { source: string, expected: [string[], unknown[]] }[] = [
        {
            source: `Before {{fce1()}} After`,
            expected: [
                ["Before ", " After"],
                ["Function 1"],
            ],
        },
        {
            source: `Before {{upper()}} After`,
            expected: [
                ["Before ", " After"],
                [""],
            ],
        },
        {
            source: `Before {{upper("ahoj")}} After`,
            expected: [
                ["Before ", " After"],
                ["AHOJ"],
            ],
        },
        {
            source: `Before {{upper(foo)}} After`,
            expected: [
                ["Before ", " After"],
                ["FOO"],
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
                    .filter(x => x.type === Expression.CallableVariable)
                    .map(x => x as ExpressionType<Expression.CallableVariable>)
                    .map(({ serialize }) => serialize(params))
            ],
            expected,
        );
    }
});
