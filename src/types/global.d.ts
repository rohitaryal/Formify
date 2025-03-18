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

interface ParsedOptions {
    value: string;
    moreInfo: any[] | null;
}

interface ParsedQuestion {
    title: string;
    moreInfo: any[] | null;
    type: number,
    id: number,
    required: boolean,
    options: ParsedOptions;
}

interface ParsedResult {
    title: string | null;
    description: string | null;
    questions: ParsedQuestion;
}