import { Template } from "./Template.ts";
import { ContextFragmentFactory } from "./ContextFragmentFactory.ts";
import { ExpressionsParser } from "./ExpressionsParser.ts";


export class TemplateFactory {

    #fragmentFactory = new ContextFragmentFactory();
    #expressionsParser = new ExpressionsParser();


    create(path: string): Template {
        const template = new Template(path, this.#fragmentFactory, this.#expressionsParser);

        return template;
    }

}