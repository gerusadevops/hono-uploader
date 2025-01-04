import * as hono_types from 'hono/types';
import { ObjectCannedACL, S3Client } from '@aws-sdk/client-s3';

interface HonoFileStorageOption {
    saveFile(file: File, filename: string): Promise<string>;
}

declare enum HonoUploadError {
    FILE_NOT_FOUND = "file.upload.error.file_not_found",
    FILES_NOT_FOUND = "file.upload.error.files_not_found",
    EXPECTED_ARRAY_OF_FILES = "file.upload.error.expected_array_of_files",
    INVALID_FILE = "file.upload.error.invalid_file",
    INVALID_FILE_TYPE = "file.upload.error.invalid_file_type",
    FILE_TOO_BIG = "file.upload.error.file_too_big",
    EMPTY_FILE = "file.upload.error.empty_file",
    EMPTY_FILENAME = "file.upload.error.empty_filename"
}

interface UploadOptions {
    getFileKey: (file: File) => string;
    fileMimeFilter: (file: File) => boolean;
    maxFileSizeBytes?: number;
    maxFilesCount?: number;
    required: boolean;
}
declare const UploadOptionsDefault: UploadOptions;
declare const UploadOptionsImages: UploadOptions;

interface UploadedFile {
    location: string;
    file: File;
}
declare class HonoUpload {
    private storage;
    constructor(storage?: HonoFileStorageOption);
    private validateFileIntegrity;
    optionalSingle(fieldName: string, uploadOptions?: UploadOptions): hono_types.MiddlewareHandler<{
        Variables: {
            file?: UploadedFile;
        };
    }, string, {}>;
    single(fieldName: string, uploadOptions?: UploadOptions): hono_types.MiddlewareHandler<{
        Variables: {
            file: UploadedFile;
        };
    }, string, {}>;
    array(fieldName: string, uploadOptions?: UploadOptions): hono_types.MiddlewareHandler<{
        Variables: {
            files: UploadedFile[];
        };
    }, string, {}>;
}

declare class HonoStorageDisk implements HonoFileStorageOption {
    route: string;
    constructor(route?: string);
    saveFile(file: File, filename: string): Promise<string>;
}

interface S3BucketOptions {
    bucketName: string;
    acl?: ObjectCannedACL;
}
interface IHonoUploadS3Configuration {
    s3Client: S3Client;
    bucketConfig: S3BucketOptions;
}
declare function amazonS3Configurator(accessKeyId: string, accessKeySecret: string, bucketName: string, region: string, acl?: ObjectCannedACL): IHonoUploadS3Configuration;
declare function digitalOceanSpacesS3Configurator(accessKeyId: string, accessKeySecret: string, bucketName: string, acl?: ObjectCannedACL): IHonoUploadS3Configuration;

interface HonoUploadS3Path {
    path: string;
}
declare class HonoStorageS3 implements HonoFileStorageOption {
    s3Client: S3Client;
    bucketOptions: S3BucketOptions;
    basePath: string;
    constructor(s3Config: IHonoUploadS3Configuration, path: HonoUploadS3Path);
    saveFile(file: File, filename: string): Promise<string>;
}

declare class HonoUploadS3Deleter {
    s3Configuration: IHonoUploadS3Configuration;
    constructor(s3Configuration: IHonoUploadS3Configuration);
    deleteFileFromAmazonUrl(url: string): Promise<string | null>;
    deleteFileFromDigitalOceanUrl(url: string): Promise<boolean>;
}

export { type HonoFileStorageOption, HonoStorageDisk, HonoStorageS3, HonoUpload, HonoUploadError, HonoUploadS3Deleter, type IHonoUploadS3Configuration, type S3BucketOptions, type UploadOptions, UploadOptionsDefault, UploadOptionsImages, type UploadedFile, amazonS3Configurator, digitalOceanSpacesS3Configurator };
