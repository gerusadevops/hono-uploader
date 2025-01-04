import { createMiddleware } from "hono/factory";
import type { HonoFileStorageOption } from "./interface/HonoStorageOption";
import { HonoStorageDisk } from "./storage/HonoStorageDisk";
import { type UploadOptions, UploadOptionsDefault } from "./HonoUploadOptions";
import { HTTPException } from "hono/http-exception";
import { HonoUploadError } from "./HonoUploadError";


export interface UploadedFile {
    location: string;
    file: File;
}



export class HonoUpload {
    private storage: HonoFileStorageOption;

    constructor(storage?: HonoFileStorageOption) {
        this.storage = storage || new HonoStorageDisk();
    }

    private validateFileIntegrity(file: File | null, uploadOptions: UploadOptions) {
        if (file == null) throw new HTTPException(400, { message: HonoUploadError.FILE_NOT_FOUND });
        if (file.size == 0) throw new HTTPException(400, { message: HonoUploadError.EMPTY_FILE });
        if (file.name == undefined || file.name == '') throw new HTTPException(400, { message: HonoUploadError.EMPTY_FILENAME });
        if (uploadOptions.fileMimeFilter(file) == false) throw new HTTPException(400, { message: HonoUploadError.INVALID_FILE_TYPE });
        if (uploadOptions.maxFileSizeBytes && file.size > uploadOptions.maxFileSizeBytes) throw new HTTPException(400, { message: HonoUploadError.FILE_TOO_BIG });
    }

    optionalSingle(fieldName: string, uploadOptions: UploadOptions = UploadOptionsDefault) {
        return createMiddleware<{ Variables: { file?: UploadedFile } }>(async (c, next) => {
            const body = await c.req.parseBody();
            const file = body[fieldName];

            let finalPath: string | null = null;
            if (file != null) {
                if (file instanceof File == false) throw new Error('Invalid file');
                this.validateFileIntegrity(file, uploadOptions);
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

            if (file == null) throw new HTTPException(400, { message: HonoUploadError.FILE_NOT_FOUND });
            if (file instanceof File == false) throw new HTTPException(400, { message: HonoUploadError.INVALID_FILE });

            this.validateFileIntegrity(file, uploadOptions);

            const filename = uploadOptions.getFileKey(file);
            const finalPath = await this.storage.saveFile(file, filename);
            c.set('file', { location: finalPath, file });
            await next();
        });
    }

    array(fieldName: string, uploadOptions: UploadOptions = UploadOptionsDefault) {
        return createMiddleware<{ Variables: { files: UploadedFile[] } }>(async (c, next) => {
            const body = await c.req.formData();

            let filesArray: File[] | File | any = body.getAll(fieldName);


            if (filesArray === null) throw new HTTPException(400, { message: HonoUploadError.FILES_NOT_FOUND });
            if (filesArray instanceof File === true) filesArray = [filesArray];
            if (filesArray instanceof Array === false) throw new HTTPException(400, { message: HonoUploadError.EXPECTED_ARRAY_OF_FILES });
            for (const file of filesArray) {
                if (file instanceof File === false) throw new HTTPException(400, { message: HonoUploadError.INVALID_FILE });
            }
            const actualFiles = filesArray as File[];
            const filesLocation = await Promise.all(actualFiles.map(async (file) => {
                const currentfile = file as File;
                this.validateFileIntegrity(currentfile, uploadOptions);
                const filename = uploadOptions.getFileKey(currentfile);
                const finalPath = await this.storage.saveFile(currentfile, filename);
                return { location: finalPath, file: currentfile };
            }));
            c.set('files', filesLocation);
            await next();
        });
    }
}