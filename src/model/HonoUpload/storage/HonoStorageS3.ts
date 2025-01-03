import type { HonoFileStorageOption } from "../interface/HonoStorageOption";
import { S3Client, ObjectCannedACL } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from 'path';

export interface S3BucketOptions {
    bucketName: string;
    acl?: ObjectCannedACL;
}

export class HonoStorageS3 implements HonoFileStorageOption {
    s3Client: S3Client;
    bucketOptions: S3BucketOptions;
    basePath: string;
    constructor(s3Client: S3Client, bucketOptions: S3BucketOptions, basePath: string = '') {
        this.s3Client = s3Client;
        this.bucketOptions = bucketOptions;
        this.basePath = basePath;
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