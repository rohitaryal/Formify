import { groupedLog } from "./Utils";

interface Storage {
    [key: string]: string;
}

// Get value for a key from localStorage
const getItem = (key: string): string | null => {
    // Fetch whats stored
    const storage = localStorage.getItem('formify');
    try {
        // Parse string we obtained from localStorage
        const parsedStorage = JSON.parse(storage || '{}');

        // Return corresponding value for key
        return parsedStorage[key] || null;
    } catch (err) {
        groupedLog(
            "Failed to parse JSON from localStorage",
            err,
        );

        // Value not found
        return null;
    }
}

// Put value with key as reference in localStorage
const setItem = (key: string, value: string): void => {
    // Fetch whats stored
    const storage = localStorage.getItem('formify');
    let parsedStorage: Storage = {};

    try {
        // Parse string we obtained from localStorage
        parsedStorage = JSON.parse(storage || '{}');
    } catch (err) {
        // Failed to parse, will use `{}` as default
        groupedLog(
            "Failed to parse JSON from localStorage",
            err,
        );
    }

    // Populate [key, value]
    parsedStorage[key] = value;

    // Re-Save the modified JSON to localStorage
    localStorage.setItem('formify', JSON.stringify(parsedStorage));
}

// Remove a [key, value] from localStorage
const removeItem = (key: string): void => {
    const storage = localStorage.getItem('formify');
    let parsedStorage: Storage = {};

    try {
        parsedStorage = JSON.parse(storage || '{}');
    } catch (err) {
        groupedLog(
            "Failed to parse JSON from localStorage",
            err,
        );

        // No need to delete if failed
        return;
    }

    delete parsedStorage[key];

    // Re-save modified JSOn
    localStorage.setItem('formify', JSON.stringify(parsedStorage));
}

// Clear localStorage (not whole but only formify)
const clear = (): void => {
    localStorage.setItem('formify', '{}');
}

export { getItem, setItem, removeItem, clear };