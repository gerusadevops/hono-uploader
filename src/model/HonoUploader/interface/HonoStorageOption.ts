export interface HonoFileStorageOption {
    saveFile(file: File, filename: string): Promise<string>;
}