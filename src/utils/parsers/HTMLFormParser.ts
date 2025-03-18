/**
 * This is `HTML Form Parser` that will parse html and build ParsedResult manually
 */

const formHeaderParser = (form: HTMLFormElement) => {
    // Form further contains a main body content
    const formContentContainer = form.querySelector(".lrKTG");
    if (!formContentContainer)
        throw new Error("[!] Form content not found. Are you sure you are providing correct form?")

    // Title and description are inside a container
    const formHeader = formContentContainer.querySelector(".m7w29c.O8VmIc.tIvQIf");
    if (!formHeader)
        console.warn("[W] Form header was not found")

    const formTitleContainer = formHeader?.querySelector(".ahS2Le")
    const formDescriptionContainer = formHeader?.querySelector(".cBGGJ.OIC90c");

    return {
        formTitle: formTitleContainer?.textContent || document.title, // Final hope to get header
        formDescription: formDescriptionContainer?.textContent || "",
    }
}

const formQuestionParser = (form: HTMLFormElement): ParsedQuestion[] => {
    // Strict type checking form: HTMLFormElement
    if (!(form instanceof HTMLFormElement))
        throw new Error("[!] I strictly require HTMLFormElement to parse header");

    // No point in moving forward if question container is missing
    const questionContainer = form.querySelector(".o3Dpx[role='list']");
    if (!questionContainer)
        throw new Error("Question container is missing. Are you sure you are providing correct form?");

    const questionList = questionContainer.querySelectorAll(".Qr7Oae[role='listitem']");

    if (!questionList.length)
        console.warn("[W] No questions found.");

    // Map each question to beautified parsed question
    const parsedQuestions: ParsedQuestion[] = [...questionList]?.map((questionContainer) => {
        // This parent div holds 'data-params' which contain parsable question details
        const infoContainerDiv = questionContainer.querySelector("div[jsmodel='CP1oW']");

        const dataParams = infoContainerDiv?.getAttribute("data-params");
        const betterDataParams = dataParams
            ?.replace("%.@.", "[") // data-param begins with missing '['
            .replace(/&quot;/g, "'"); // Replace escaped quotes
        const question = JSON.parse(betterDataParams || '[]')[0];

        if (!question) {
            return {
                title: "",
                moreInfo: "",
                type: -1,
                id: "",
                required: false,
                options: [],
            }
        }


        const questionTitle = question[1];

        // Extra infomation mean images, etc
        // Originally its array if it contains extra info
        // and null otherwise
        const extraInformation = question[9] || null;

        // Question type determine short answers, checkboxes
        // radio buttons, paragraphs, etc. You may use
        // Utils.getType() to represent them in readable way
        const questionType = question[3];

        // Submit id is useful to sumbit answer in restful way
        const submitID = question[4][0][0];

        // Must fill question
        const isRequiredQuestion = question[4][0][2];

        // Options will be null for question types like 
        // paragraphs, short answers
        const options: ParsedOption[] = question[4][0][1]?.map((option: any) => {
            return {
                'value': option[0],
                // The option might contain more information
                // like images, etc or 'false' otherwise
                'moreInfo': option[5] || null,
            }
        });

        return {
            title: questionTitle,
            moreInfo: extraInformation,
            type: questionType,
            id: submitID,
            required: isRequiredQuestion,
            options,
        }
    });

    return parsedQuestions;
}

const parse = (): ParsedResult => {
    // This form represents main form which contains all the things
    // we require here
    const form: HTMLFormElement | null = document.querySelector("form#mG61Hd");

    if (!form) {
        throw new Error("Form element not found");
    }

    const { formDescription, formTitle } = formHeaderParser(form);

    // Parsed questions array
    const parsedQuestionList = formQuestionParser(form);

    return {
        title: formTitle,
        description: formDescription,
        questions: parsedQuestionList,
    }
}

export { parse }