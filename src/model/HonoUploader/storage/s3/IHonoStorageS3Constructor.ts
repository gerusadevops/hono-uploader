import { ObjectCannedACL, S3Client } from "@aws-sdk/client-s3";


export interface S3BucketOptions {
    bucketName: string;
    acl?: ObjectCannedACL;
}

export interface IHonoUploaderS3Configuration {
    s3Client: S3Client;
    bucketConfig: S3BucketOptions;
}


export function amazonS3Configurator(accessKeyId: string, accessKeySecret: string, bucketName: string, region: string, acl: ObjectCannedACL = "public-read"): IHonoUploaderS3Configuration {
   
    console.table({ accessKeyId, accessKeySecret, bucketName, region });

    const s3Client = new S3Client({
        region: region,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: accessKeySecret
        },
        forcePathStyle: true,
    });
    const s3BucketOptions: S3BucketOptions = { bucketName: bucketName, acl };
    return { s3Client, bucketConfig: s3BucketOptions };
}

export function digitalOceanSpacesS3Configurator(accessKeyId: string, accessKeySecret: string, bucketName: string, acl: ObjectCannedACL = "public-read"): IHonoUploaderS3Configuration {
    const s3Client = new S3Client({
        endpoint: "https://nyc3.digitaloceanspaces.com",
        forcePathStyle: false,
        region: 'us-east-1',
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: accessKeySecret
        }
    });
    const s3BucketOptions: S3BucketOptions = { bucketName: bucketName, acl };
    return { s3Client, bucketConfig: s3BucketOptions };
}