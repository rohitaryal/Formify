const overlay = document.querySelector(".dialog-container");
const dialog = document.querySelector(".dialog-container .dialog");
const closeButton = document.querySelector(".dialog-container .dialog .formify-header .close");
const apiField = document.querySelector('.dialog-container .dialog input#apikey');
const modelSelect = document.querySelector('.dialog-container .dialog select#ai-model');
const searchEngineSelect = document.querySelector('.dialog-container .dialog select#search-engine');
const customPromptField = document.querySelector('.dialog-container .dialog input#custom-prompt');

const setItem = (key, value) => {
    const storage = localStorage.getItem('formify');
    const parsedStorage = JSON.parse(storage || '{}');

    parsedStorage[key] = value;

    localStorage.setItem('formify', JSON.stringify(parsedStorage));
}

const getItem = (key) => {
    const storage = localStorage.getItem('formify');
    const parsedStorage = JSON.parse(storage || '{}');
    return parsedStorage[key];
}

const apiKey = getItem('apiKey');
const model = getItem('model');
const searchEngine = getItem('searchURL');
const customPrompt = getItem('customPrompt');

if (!model)
    setItem('model', "gemini-2.0-flash-lite");

if (!searchEngine)
    setItem('searchURL', "https://www.google.com/search?q=");

if (!customPrompt)
    setItem("customPrompt", "Your answer must include one of the options i provided here and please answer shortly and no markdown like response allowed, plain text and write the full answer, provide short description if possible");

// Re-assigning values to the fields
apiField.value = getItem('apiKey');
modelSelect.value = getItem('model');
searchEngineSelect.value = getItem('searchURL');
customPromptField.value = getItem('customPrompt');

overlay.addEventListener('click', (e) => {
    if (
        e.target === overlay ||
        e.target === closeButton
    ) {
        overlay.classList.toggle("active");
    }
});

apiField.addEventListener('input', (e) => {
    const apiKey = e.target.value;
    setItem('apiKey', apiKey);
});

modelSelect.addEventListener('change', (e) => {
    const selectedModel = e.target.value;
    setItem('model', selectedModel);
});

searchEngineSelect.addEventListener('change', (e) => {
    const selectedEngine = e.target.value;
    setItem('searchURL', selectedEngine);
});

customPromptField.addEventListener('input', (e) => {
    const promptValue = e.target.value;
    setItem('customPrompt', promptValue);
});