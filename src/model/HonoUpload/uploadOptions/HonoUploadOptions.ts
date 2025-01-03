export interface UploadOptions {
    getFileKey: (file: File) => string;
    fileMimeFilter: (file: File) => boolean;
    sizeLimit?: number;
    required:boolean;
}

export const UploadOptionsDefault: UploadOptions = {
    getFileKey: (file:File) =>{
        return `${Date.now()}-${file.name}`;
    },
    fileMimeFilter: (file) => true,
    required:false,

}

export const UploadOptionsImages: UploadOptions = {
    getFileKey: (file) => `${Date.now()}-${file.name}`,
    fileMimeFilter: (file) => {
        const mime = file.type;
        return mime === 'image/jpeg' || mime === 'image/png';
    },
    sizeLimit: 1024 * 350,
    required:false
}


