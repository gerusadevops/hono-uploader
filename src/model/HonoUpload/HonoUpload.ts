import { createMiddleware } from "hono/factory";
import type { HonoFileStorageOption } from "./interface/HonoStorageOption";
import { HonoStorageDisk } from "./storage/HonoStorageDisk";
import { type UploadOptions, UploadOptionsDefault } from "./uploadOptions/HonoUploadOptions";
import { HTTPException } from "hono/http-exception";


interface UploadedFile {
    location: string;
    file: File;
}

export enum HonoUploadError {
    FILE_NOT_FOUND = 'file.upload.error.file_not_found',
    INVALID_FILE = 'file.upload.error.invalid_file',
    INVALID_FILE_TYPE = 'file.upload.error.invalid_file_type',
    FILE_TOO_BIG = 'file.upload.error.file_too_big',
    EMPTY_FILE = 'file.upload.error.empty_file',
    EMPTY_FILENAME = 'file.upload.error.empty_filename'
}

export class HonoUpload {
    private storage: HonoFileStorageOption;

    constructor(storage?: HonoFileStorageOption) {
        this.storage = storage || new HonoStorageDisk();
    }

    private validarIntegridadDeFile(file: File | null, uploadOptions: UploadOptions) {
        if (file == null) throw new HTTPException(400, { message: HonoUploadError.FILE_NOT_FOUND });
        if (file.size == 0) throw new HTTPException(400, { message: HonoUploadError.EMPTY_FILE });
        if (file.name == undefined || file.name == '') throw new HTTPException(400, { message: HonoUploadError.EMPTY_FILENAME });
        if (uploadOptions.fileMimeFilter(file) == false) throw new HTTPException(400, { message: HonoUploadError.INVALID_FILE_TYPE });
        if (uploadOptions.sizeLimit && file.size > uploadOptions.sizeLimit) throw new HTTPException(400, { message: HonoUploadError.FILE_TOO_BIG });
    }

    optionalSingle(fieldName: string, uploadOptions: UploadOptions = UploadOptionsDefault) {
        return createMiddleware<{ Variables: { file?: UploadedFile } }>(async (c, next) => {
            const body = await c.req.parseBody();
            const file = body[fieldName];

            let finalPath: string | null = null;
            if (file != null) {
                if (file instanceof File == false) throw new Error('Invalid file');
                this.validarIntegridadDeFile(file, uploadOptions);
                const filename = uploadOptions.getFileKey(file);
                finalPath = await this.storage.saveFile(file, filename);
                c.set('file', { location: finalPath, file });
            }
            await next();
        });
    }

    single(fieldName: string, uploadOptions: UploadOptions = UploadOptionsDefault) {
        return createMiddleware<{ Variables: { file: UploadedFile } }>(async (c, next) => {
            const body = await c.req.parseBody();
            const file = body[fieldName];

            if (file == null) throw new Error('File not found');
            if (file instanceof File == false) throw new Error('Invalid file');


            this.validarIntegridadDeFile(file, uploadOptions);

            const filename = uploadOptions.getFileKey(file);
            const finalPath = await this.storage.saveFile(file, filename);
            c.set('file', { location: finalPath, file });
            await next();
        });
    }

    array(fieldName: string, uploadOptions: UploadOptions = UploadOptionsDefault) {
        return createMiddleware<{ Variables: { files: UploadedFile[] } }>(async (c, next) => {
            const body = await c.req.parseBody();
            const files = body[fieldName];

            if (files == null) throw new Error('Files not found');
            if (files instanceof Array == false) throw new Error('Invalid files');
            for (const file of files) {
                if (file instanceof File == false) throw new Error('Invalid file');
            }
            const filesLocation = await Promise.all(files.map(async (file) => {
                const currentfile = file as File;
                this.validarIntegridadDeFile(currentfile, uploadOptions);
                const filename = uploadOptions.getFileKey(currentfile);
                const finalPath = await this.storage.saveFile(currentfile, filename);
                return { location: finalPath, file: currentfile };
            }));
            c.set('files', filesLocation);
            await next();
        });
    }
}