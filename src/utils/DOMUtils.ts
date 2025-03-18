interface AnswerModalParam {
    answer: string;
    question: string;
    options: ParsedOption[] | null,
}

interface ButtonConfig {
    id: string;
    title: string;
    text: string;
    onclick: (e: Event) => void;
}

import { getAIResponse } from "./AIUtils.ts";
import { getItem } from "./StorageUtils.ts";
import { groupedLog } from "./Utils.ts";

const answerModal = ({ options, question, answer }: AnswerModalParam): HTMLDivElement => {
    const div = document.createElement("div");
    div.classList.add("ai-container");

    const header = document.createElement("span");
    header.classList.add("container-header");

    const modelNameSpan = document.createElement("span");
    modelNameSpan.classList.add("model-name");
    modelNameSpan.textContent = `🦕  ${getItem("model") || "gemini-2.0-flash"}`;

    const buttons = document.createElement("span");
    buttons.classList.add("buttons");

    const body = document.createElement("span");
    body.classList.add("container-body");
    body.textContent = answer;

    // Flatten options to a string
    const option = options?.map(option => option.value)?.join(" ") || "";

    const buttonConfigs: ButtonConfig[] = [
        {
            id: "copy",
            title: "Copy answer to clipboard",
            text: "Copy",
            onclick: (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(answer);
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
                body.textContent = "Re-generating answer... 🦕";

                const response = await getAIResponse({
                    prompt: getItem("customPrompt") + "\n" + question + option,
                });

                body.textContent = response;
            }
        },
        {
            id: "open-chat",
            title: "Open this question in chat",
            text: "Open in Chat",
            onclick: (e) => {
                e.preventDefault();


                openAIChat();
                sendMessage(getItem("customPrompt") + "\n" + question + option);
            }
        },
        {
            id: "search",
            title: "Search this question",
            text: "Search",
            onclick: (e) => {
                const anchor = document.createElement("a");
                anchor.href = (getItem("searchURL") || "https://www.google.com/search?q=") + question + option;
                anchor.target = "_blank";
                anchor.click();
            },
        },
    ];

    buttonConfigs.forEach(({ id, title, text, onclick }) => {
        const button = document.createElement("button");
        button.setAttribute("type", "button");

        button.id = id;
        button.title = title;
        button.textContent = text;
        buttons.appendChild(button);
        button.addEventListener("click", onclick);
    });

    header.appendChild(modelNameSpan);
    header.appendChild(buttons);
    div.appendChild(header);
    div.appendChild(body);

    return div;
}

const toggleDialog = (force?: boolean) => {
    const dialog = document.querySelector(".dialog-container");

    if (!dialog) {
        groupedLog("Dialog container not found");
        return;
    }

    if (force === true) {
        dialog.classList.remove("hidden");
    } else if (force === false) {
        dialog.classList.add("active");
    } else {
        dialog.classList.toggle("active");
    }
}

const toggleAnswers = (force?: boolean) => {
    const aiResponse = document.querySelectorAll(".ai-container");
    aiResponse.forEach((response) => {
        if (force === true) {
            response.classList.remove("inactive");
        } else if (force === false) {
            response.classList.add("inactive");
        } else {
            response.classList.toggle("inactive");
        }
    });
}

const dialogWidth: string = '300px';
const dialogHeight: string = '400px';

let aiChatDialog: HTMLDivElement | null = null;
let chatHistory: HTMLDivElement;
let messageInput: HTMLInputElement;
let isDragging: boolean = false;
let offsetX: number, offsetY: number;


function addMessage(text: string, isUser: boolean): void {
    const messageElement: HTMLDivElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'userMessage' : 'aiMessage');
    messageElement.textContent = text;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendMessage(msg: string = ""): Promise<void> {
    const message: string = messageInput.value.trim() || msg;
    if (message) {
        addMessage(message, true);
        messageInput.value = '';

        try {
            const aiResponse: string = await getAIResponse({ prompt: message });
            addMessage(aiResponse, false);
        } catch (error) {
            addMessage("Error: Could not get AI response.", false);
            console.error("Error fetching AI response:", error);
        }
    }
}

function createAIChatDialog(): HTMLDivElement {
    aiChatDialog = document.createElement('div');
    aiChatDialog.id = 'aiChatDialog';
    aiChatDialog.style.width = dialogWidth;
    aiChatDialog.style.height = dialogHeight;

    const dialogHeader: HTMLDivElement = document.createElement('div');
    dialogHeader.id = 'dialogHeader';
    const headerText: Text = document.createTextNode('Formify');
    dialogHeader.appendChild(headerText);

    const closeButton: HTMLSpanElement = document.createElement('span');
    closeButton.id = 'closeButton';
    const closeText: Text = document.createTextNode('\u00D7');
    closeButton.appendChild(closeText);

    chatHistory = document.createElement('div');
    chatHistory.id = 'chatHistory';

    const chatInputArea: HTMLDivElement = document.createElement('div');
    chatInputArea.id = 'chatInputArea';

    messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.id = 'messageInput';
    messageInput.placeholder = 'Type your message...';

    const sendButton: HTMLButtonElement = document.createElement('button');
    sendButton.id = 'sendButton';
    const sendText: Text = document.createTextNode('Send');
    sendButton.appendChild(sendText);

    dialogHeader.appendChild(closeButton);
    chatInputArea.appendChild(messageInput);
    chatInputArea.appendChild(sendButton);
    aiChatDialog.appendChild(dialogHeader);
    aiChatDialog.appendChild(chatHistory);
    aiChatDialog.appendChild(chatInputArea);

    closeButton.addEventListener('click', closeAIChat); // close, not destroy
    sendButton.addEventListener('click', () => sendMessage());
    messageInput.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    dialogHeader.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true;
        offsetX = e.clientX - aiChatDialog!.offsetLeft;
        offsetY = e.clientY - aiChatDialog!.offsetTop;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // Keep within bounds
        const maxX = window.innerWidth - aiChatDialog!.offsetWidth;
        const maxY = window.innerHeight - aiChatDialog!.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX)); // keep within screen bounds
        newY = Math.max(0, Math.min(newY, maxY));

        aiChatDialog!.style.left = newX + 'px';
        aiChatDialog!.style.top = newY + 'px';
        aiChatDialog!.style.right = 'auto'; // important, override 'right' property
    });

    aiChatDialog.classList.add('aiChatDialog');
    dialogHeader.classList.add('dialogHeader');
    closeButton.classList.add('closeButton');
    chatHistory.classList.add('chatHistory');
    chatInputArea.classList.add('chatInputArea');
    messageInput.classList.add('messageInput');
    sendButton.classList.add('sendButton');

    document.body.appendChild(aiChatDialog);
    addMessage("Starting conversation...", false);
    return aiChatDialog;
}

function closeAIChat(): void {
    if (aiChatDialog) {
        aiChatDialog.style.display = 'none';
    }
}

function openAIChat(): void {
    if (!aiChatDialog) {
        createAIChatDialog();
    }
    aiChatDialog!.style.display = 'flex';
}

const ready = () => {
    const dialogContainer = document.createElement('div');
    dialogContainer.className = 'dialog-container';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    const header = document.createElement('span');
    header.className = 'formify-header';

    const logo = document.createElement('img');
    logo.alt = 'F is for Formify';
    logo.height = 40;
    logo.src = 'data:image/png;base64,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';

    const headerText = document.createElement('span');
    headerText.className = 'formify-text';
    const boldText = document.createElement('b');
    boldText.innerText = 'Formify';
    headerText.appendChild(boldText);

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.innerText = '×';

    header.appendChild(logo);
    header.appendChild(headerText);
    header.appendChild(closeBtn);

    const formBody = document.createElement('span');
    formBody.className = 'form-body';

    const ul = document.createElement('ul');

    const listItems = [
        { label: 'API Key', type: 'text', id: 'apikey', placeholder: 'Paste API key here' },
        {
            label: 'AI Model', type: 'select', id: 'ai-model', options: [
                { value: 'gemini-2.0-pro-exp-02-05', text: 'Gemini 2.0 Pro Experimental' },
                { value: 'gemini-2.0-flash', text: 'Gemini 2.0 Flash' },
                { value: 'gemini-2.0-flash-lite', text: 'Gemini 2.0 Flash-Lite' },
                { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro' },
                { value: 'gpt-4.5-preview', text: 'gpt-4.5-preview' },
                { value: 'gpt-4o-mini', text: 'gpt-4o-mini' }
            ]
        },
        {
            label: 'Search Engine', type: 'select', id: 'search-engine', options: [
                { value: 'https://www.google.com/search?q=', text: 'Google' },
                { value: 'https://chatgpt.com/?q=', text: 'ChatGPT Search' },
                { value: 'https://www.bing.com/search?q=', text: 'Bing' },
                { value: 'https://search.yahoo.com/search?p=', text: 'Yahoo' },
                { value: 'https://duckduckgo.com/?q=', text: 'DuckDuckGo' },
                { value: 'https://www.baidu.com/s?wd=', text: 'Baidu' },
                { value: 'https://www.yandex.com/search/?text=', text: 'Yandex' },
                { value: 'https://www.ecosia.org/search?q=', text: 'Ecosia' },
                { value: 'https://www.ask.com/web?q=', text: 'Ask' },
                { value: 'https://www.startpage.com/do/search?q=', text: 'Startpage' },
                { value: 'https://search.brave.com/search?q=', text: 'Brave Search' }
            ]
        },
        { label: 'Custom Prompt', type: 'text', id: 'custom-prompt', placeholder: 'Custom prompt to feed the model' },
        { label: 'Dialog Shortcuts', type: 'code', value: 'ALT + K' },
        { label: 'AI Response hide/unhide', type: 'code', value: 'ALT + M' }
    ];

    listItems.forEach(item => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.innerText = item.label;

        if (item.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.setAttribute('name', item.id || "");
            input.setAttribute('id', item.id || "");
            input.setAttribute('placeholder', item.placeholder || "");
            li.appendChild(label);
            li.appendChild(input);
        } else if (item.type === 'select') {
            const select = document.createElement('select');
            select.setAttribute('name', item.id || "");
            select.setAttribute('id', item.id || "");
            item.options!.forEach(optionData => {
                const option = document.createElement('option');
                option.setAttribute('value', optionData.value);
                option.textContent = optionData.text;
                select.appendChild(option);
            });
            li.appendChild(label);
            li.appendChild(select);
        } else if (item.type === 'code') {
            const code = document.createElement('code');
            code.textContent = item.value || "";
            li.appendChild(label);
            li.appendChild(code);
        }

        ul.appendChild(li);
    });

    formBody.appendChild(ul);
    const formFooter = document.createElement('span');
    formFooter.className = 'form-footer';

    const footerLinks = [
        { href: 'https://github.com/rohitaryal/formify', text: 'Submit a bug ↗' },
        { href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', text: 'Hmm ↗' }
    ];

    footerLinks.forEach(linkData => {
        const link = document.createElement('a');
        link.target = '_blank';
        link.href = linkData.href;
        link.innerText = linkData.text;
        formFooter.appendChild(link);
    });

    dialog.appendChild(header);
    dialog.appendChild(formBody);
    dialog.appendChild(formFooter);

    dialogContainer.appendChild(dialog);

    document.body.appendChild(dialogContainer);

}

export { answerModal, toggleDialog, toggleAnswers, ready, openAIChat, closeAIChat };