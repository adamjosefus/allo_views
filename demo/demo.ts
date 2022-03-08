import { RouterList } from "https://deno.land/x/allo_routing@v1.1.4/mod.ts";
import { Server } from "https://deno.land/x/allo_server@v1.0.1/mod.ts";


const port = 8080;

const router = new RouterList();
router.add("", (req: Request, params: Record<string, string>) => {
    return new Response("Hello world!");
});

const server = new Server(router);
server.listen({port})

console.log(`http://localhost:${port}`);
