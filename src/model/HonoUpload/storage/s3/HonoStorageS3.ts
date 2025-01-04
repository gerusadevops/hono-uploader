import type { HonoFileStorageOption } from "../../interface/HonoStorageOption";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { IHonoUploadS3Configuration, S3BucketOptions } from "./IHonoStorageS3Constructor";
import path from 'path';


interface HonoUploadS3Path {
    path: string;
}

export class HonoStorageS3 implements HonoFileStorageOption {
    s3Client: S3Client;
    bucketOptions: S3BucketOptions;
    basePath: string;
    constructor(s3Config: IHonoUploadS3Configuration, path: HonoUploadS3Path) {
        this.basePath = path.path;
        this.s3Client = s3Config.s3Client;
        this.bucketOptions = s3Config.bucketConfig;
    }
    async saveFile(file: File, filename: string): Promise<string> {
        const filenameSanitizado = filename.replace(/[^a-zA-Z0-9.]/g, '');
        const key = path.join(this.basePath, filenameSanitizado);
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: this.bucketOptions.bucketName,
                Key: key,
                ACL: this.bucketOptions.acl,
                Body: file
            }
        });
        const resultado = await upload.done();
        const location = resultado.Location;
        if (location == null) throw new Error('No se pudo subir el archivo');
        return location;
    }

}