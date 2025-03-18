import { build } from "./build";

const server = Bun.serve({
    port: process.env.PORT || 1024,
    routes: {
        "/": async () => {
            // Build the files
            const buildOutput = await build(false);

            // Send the file content
            return new Response(buildOutput, {
                headers: {
                    "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "content-type": "text/javascript",
                },
            });
        },
    },
    fetch() {
        return new Response(
            "Hi it wasn't expected for you to visit this page."
        );
    },
});

console.log("[+] Listening for request at port", server.port);