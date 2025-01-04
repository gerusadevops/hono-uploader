import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { IHonoUploaderS3Configuration } from "./IHonoStorageS3Constructor";

export class HonoUploaderS3Deleter {
    s3Configuration: IHonoUploaderS3Configuration
    constructor(s3Configuration: IHonoUploaderS3Configuration) {
        this.s3Configuration = s3Configuration;
    }
    async deleteFileFromAmazonUrl(url: string): Promise<string | null> {
        const { s3Client, bucketConfig } = this.s3Configuration;
        const key = url.split(`amazonaws.com/${bucketConfig.bucketName}/`)[1];
        const params = {
            Bucket: bucketConfig.bucketName,
            Key: key
        }
        try {
            const deleteObjectInstruction = new DeleteObjectCommand(params);
            await s3Client.send(deleteObjectInstruction);
            return url;
        } catch (err) {
            console.error('Error deleting file from S3: ', err);
            return null;
        }
    }

    async deleteFileFromDigitalOceanUrl(url: string) {
        const { s3Client, bucketConfig } = this.s3Configuration;
        const key = url.split("digitaloceanspaces.com/")[1];
        const params = {
            Bucket: bucketConfig.bucketName,
            Key: key
        }
        try {
            const deleteObjectInstruction = new DeleteObjectCommand(params);
            await s3Client.send(deleteObjectInstruction);
            return true;
        } catch (err) {
            console.error('Error deleting file from S3: ', err);
            return false;
        }
    }
}
