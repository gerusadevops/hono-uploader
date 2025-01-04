export interface UploadOptions {
    getFileKey: (file: File) => string;
    fileMimeFilter: (file: File) => boolean;
    maxFileSizeBytes?: number;
    maxFilesCount?: number;
    required: boolean;
}

export const UploadOptionsDefault: UploadOptions = {
    getFileKey: (file: File) => {
        const sanitized = encodeURIComponent(file.name);
        return `${Date.now()}_${sanitized}`;
    },
    fileMimeFilter: (file) => {
        const mimie = file.type;
        if (mimie == null || mimie == '') return false;
        return true;
    },
    maxFileSizeBytes: 1024 * 1024, // 1MB
    required: false,
}

export const UploadOptionsImages: UploadOptions = {
    getFileKey: (file) => `${Date.now()}_${file.name}`,
    fileMimeFilter: (file) => {
        const mime = file.type;
        return mime === 'image/jpeg' || mime === 'image/png';
    },
    maxFileSizeBytes: 1024 * 1024,   // 1MB
    required: false
}


