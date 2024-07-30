export const copyToClipboard = async (str: string) => {
    await navigator.clipboard.writeText(str);
};
