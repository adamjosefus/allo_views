export interface ISnippetFactory<Context extends string> {
    create(source: string): {
        context: Context,
        source: string,
    }[];
}
