interface AnswerModalParam {
    apiKey: string;
    modelName: string;
    searchURL: string;
    answer: string;
    question: string;
    options: string[] | null,
}

interface ButtonConfig {
    id: string;
    title: string;
    text: string;
    onclick: (e: Event) => void;
}

const answerModal = (options: AnswerModalParam): HTMLDivElement => {
    const div = document.createElement("div");
    div.classList.add("ai-container");

    const header = document.createElement("span");
    header.classList.add("container-header");

    const modelNameSpan = document.createElement("span");
    modelNameSpan.classList.add("model-name");
    modelNameSpan.textContent = `🦕  ${options.modelName}`;

    const buttons = document.createElement("span");
    buttons.classList.add("buttons");

    const body = document.createElement("span");
    body.classList.add("container-body");
    body.textContent = options.answer;

    const buttonConfigs: ButtonConfig[] = [
        {
            id: "copy",
            title: "Copy answer to clipboard",
            text: "Copy",
            onclick: (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(options.answer);
                (e.target as HTMLButtonElement).textContent = "Copied";

                setTimeout(() => {
                    (e.target as HTMLButtonElement).textContent = "Copy";
                }, 2000);
            }
        },
        {
            id: "regenerate",
            title: "Re-generate answer",
            text: "Re-generate",
            onclick: async (e) => {
                e.preventDefault();
                // TODO: IMPLEMENT THIS
            }
        },
        {
            id: "open-chat",
            title: "Open this question in chat",
            text: "Open Chat",
            onclick: (e) => {
                e.preventDefault();
                // TODO: IMPLEMENT THIS
            }
        },
        {
            id: "search",
            title: "Search this question",
            text: "Search",
            onclick: (e) => {
                const anchor = document.createElement("a");
                anchor.href = options.searchURL + options.question + (options.options?.join(" ") || "");
                anchor.target = "_blank";
                anchor.click();
            },
        },
    ];

    buttonConfigs.forEach(({ id, title, text }) => {
        const button = document.createElement("button");
        button.id = id;
        button.title = title;
        button.textContent = text;
        buttons.appendChild(button);
    });

    header.appendChild(modelNameSpan);
    header.appendChild(buttons);
    div.appendChild(header);
    div.appendChild(body);

    return div;
}

export { answerModal }