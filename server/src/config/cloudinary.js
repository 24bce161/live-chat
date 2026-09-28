import { v2 as cloudinary } from 'cloudinary';

let configuredCloudinary = null;

if (process.env.UPLOAD_PROVIDER === 'cloudinary') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  configuredCloudinary = cloudinary;
}

// null when uploads are stored on the local disk
export default configuredCloudinary;
