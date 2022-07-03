import { Template } from "./Template.ts";
import { ContextedValueFactory } from "./context-values/ContextedValueFactory.ts";
import { ExpressionsParser } from "./expressions/ExpressionsParser.ts";


export class TemplateFactory {

    #contextedValueFactory: ContextedValueFactory;


    constructor() {
        const expressionsParser = new ExpressionsParser();
        this.#contextedValueFactory = new ContextedValueFactory(expressionsParser);
    }


    create(path: string): Template {
        const template = new Template(path, this.#contextedValueFactory);
        return template;
    }
}
