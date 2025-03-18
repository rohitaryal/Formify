const OUTPUT_DIR = "dist/";
const ENTRY_POINT = "src/index.ts";
const BANNER_FILE = "src/metadata.txt";

const build = async (isProduction: boolean = false): Promise<string> => {
    try {
        const result = await Bun.build({
            entrypoints: [ENTRY_POINT],

            banner:
                await Bun.file(BANNER_FILE).text() +
                "\n\n" +
                `const css = \`${await Bun.file("src/static/style.css").text()}\`;` +
                "\n\n" +
                `const js = \`${await Bun.file("src/static/script.js").text()}\`;`,

            ...(isProduction ? { outdir: OUTPUT_DIR } : {}),
        });

        console.log("[+] Build successful.");
        return result.outputs[0].text();
    } catch (err) {
        console.log(err);
        console.warn("[E] Failed to build.");
        return Promise.reject(err);
    }
}

if (process.argv[1] == import.meta.filename) {
    console.log("[+] Saving to " + OUTPUT_DIR);
    build(true);
}

export { build };