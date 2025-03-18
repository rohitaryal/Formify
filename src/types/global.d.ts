declare module "*.html" {
    const content: string;
    export default content;
}

interface RequestOptions {
    body?: string;
    headers?: Headers,
    method: "GET" | "POST";
}

interface RequestResponse {
    success: boolean;
    response: string;
    statusText: string;
}

/**
 * This interface represents the final result 
 * we obtained by scraping whole page
 */
interface ParsedResult {
    /**
     * Title of the form (Headline/Form Title)
     */
    title: string | null;
    /**
     * Sub-title for the google form
     */
    description: string | null;
    /**
     * Represents all questions present in current page
     */
    questions: ParsedQuestion[];
}


/**
 * This represents each question format that
 * we obtained from form page
 */
interface ParsedQuestion {
    /**
     * Actual question / Question title
     */
    title: string;
    /**
     * Will contain more items if this question
     * was just more than question, options.
     * 
     * For eg: Options with images, Question is image, etc
     */
    moreInfo: any[] | null;
    /**
     * Represents type of question
     * `SHORT_ANSWER`: 0,
     * `PARAGRAPH`: 1,
     * `MULTIPLE_CHOICE`: 2,
     * `CHECKBOXES`: 4,
     * `DROP_DOWN`: 3,
     * `FILE_UPLOAD`: 13,
     * `LINEAR_SCALE`: 5,
     * `GRID_CHOICE`: 7,
     * `DATE`: 9,
     * `TIME`: 10
     */
    type: number,
    /**
     * Unique id provided by forms, and is useful if we need
     * to submit answer from rest-api (out the scope for this project)
     */
    id: number,
    /**
     * If this question is a "must" to fill/answer
     */
    required: boolean,
    /**
     * Options provided in this question
     */
    options: ParsedOption[];
}


/**
 * Represents a specific option of a question
 */
interface ParsedOption {
    /**
     * Value/text-content of the option
     */
    value: string;
    /**
     * Will be present if option contained more informations
     * like images and god knows what is possible
     */
    moreInfo: any[] | null;
}