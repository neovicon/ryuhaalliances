export const getUploadPath = (filename) => {
    // Generate a unique filename
    return `${Date.now()}-${filename}`;
};
