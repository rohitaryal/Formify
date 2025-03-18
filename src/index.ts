import { parse as htmlParse } from "./utils/parsers/HTMLFormParser";
import { parse as variableParse } from "./utils/parsers/GlobalVariableParser";
import { getItem, setItem } from "./utils/StorageUtils.ts";
import { answerModal, ready, toggleAnswers, toggleDialog } from "./utils/DOMUtils";
import { getAIResponse } from "./utils/AIUtils";

declare const css: string;
declare const js: string;

declare const unsafeWindow: any;

declare const GM_addStyle: (css: string) => void;
declare const GM_addElement: (type: string, options: { textContent: string }) => void;

(async function () {
    GM_addStyle(css);
    ready();
    GM_addElement('script', {
        textContent: js,
    });

    let apiKey = getItem("apiKey");

    if (!apiKey) {
        apiKey = prompt("Please paste your API key, you can generate free api key from: https://aistudio.google.com/apikey");
        if (apiKey) {
            setItem("apiKey", apiKey);
        } else {
            alert("API key is required to interact with the AI model.");
        }
    }

    document.addEventListener('keydown', (e) => {
        if ((e.altKey && e.key == 'k') || e.key == 'Escape') {
            toggleDialog();
        }

        if (e.key == 'm' && e.altKey) {
            toggleAnswers();
        }
    });

    let scrapedContent: ParsedResult = htmlParse();

    // try {
    //     scrapedContent = unsafeWindow.FB_PUBLIC_LOAD_DATA_ ? variableParse(window.FB_PUBLIC_LOAD_DATA_) : htmlParse()
    // } catch {

    // }

    const questionContainers = document.querySelectorAll(".Qr7Oae[role='listitem']");

    for (let i = 0; i < questionContainers.length; i++) {
        const questionContainer = questionContainers[i];
        const question = scrapedContent.questions[i];

        const prompt = getItem("customPrompt") + "\n" + question.title + (
            question.options?.map(option => option.value + ", ") || ""
        );

        const aiAnswer = await getAIResponse({ prompt });

        const options = questionContainer.querySelectorAll("label");

        for (const option of options || []) {
            const betterOptionText = option.textContent?.trim();
            const betterAiAnswer = aiAnswer.trim();

            if (betterAiAnswer.includes(betterOptionText!)) {

                // These are clickable types i:e MCQ and Multi select option
                if (question.type == 2 || question.type == 4) {
                    option.click();
                    if (question.type == 2) {
                        break;
                    }
                }
            }
        }

        const answer = answerModal({
            question: question.title,
            options: question.options,
            answer: aiAnswer,
        });

        questionContainer.appendChild(answer);
    }
})();