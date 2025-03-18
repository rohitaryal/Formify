import { groupedLog } from "./Utils.ts";


const request = async (
    requestURL: string,
    requestOption: RequestOptions = {
        method: "GET"
    }
): Promise<RequestResponse> => {

    if (requestOption.method == "GET" && requestOption.body) {
        groupedLog("Removing body from GET request.", requestURL, requestOption);
        delete requestOption.body;
    }

    try {
        const response = await fetch(requestURL, requestOption);
        const responseBody = await response.text();

        if (response.status != 200) {
            groupedLog(`Server responded with status ${response.status}`,
                requestURL,
                requestOption,
                responseBody,
            );
        } else {
            groupedLog("Server responded successfully",
                requestURL,
                requestOption,
                responseBody,
            );
        }

        return {
            success: response.status == 200,
            response: responseBody,
            statusText: response.statusText,
        }
    } catch (err) {
        groupedLog("Failed to send request.",
            requestURL,
            requestOption,
            err,
        );
        return {
            success: false,
            statusText: "ERROR",
            response: (err instanceof Error) ? err.message : String(err),
        }
    }
}

export { request };