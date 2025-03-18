/**
 * This is a `Global Variable Parser` - meaning it will parse questions
 * based on the global variable `FB_PUBLIC_LOAD_DATA_`
 */

const parse = (data: any[]): ParsedResult => {
    // These are form details
    const formTitle = data[1][8];
    const formDescription = data[1][0];

    // Array of questions
    const questionList = data[1][1];

    // Parse questions in readable and easy way
    const parsedQuestionList = questionList.map((question: any) => {
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

        // Extra information are like images in question
        // Its array if contains extra information or 'null' otherwise
        const extraInformation = question[9] || null;

        // Question type means: Short answers, Checkboxes, List, etc
        // You may use Utils.getType to know type in readable way
        const questionType = question[3];

        // This submit may be useful for API based submission of answer
        const submitID = question[4][0][0];

        // Required question are must fill questions
        // Originally its mentioned 1 if required else 0
        const isRequiredQuestion = !!question[4][0][2];

        // Parse nested options in proper readable way
        // 'question[4][0][1]' when the question is something
        // like short answer, paragraph, etc,
        const options: ParsedOption[] = question[4][0][1]?.map((option: any) => {
            return {
                'value': option[0],
                // The option might contain more information
                // like images, etc or '0' otherwise
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
        };
    });

    return {
        title: formTitle,
        description: formDescription,
        questions: parsedQuestionList,
    }
}

export { parse };