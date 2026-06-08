import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Upload un buffer (image en mémoire) vers Cloudinary
export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder = "outremer-connect/avatars",
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
        ],
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      },
    );
    stream.end(file.buffer);
  });
};

// Config multer : stockage en mémoire (pas sur disque)
export const avatarUpload = multer({
  storage: multer.memoryStorage(), // fichier en RAM, pas sur disque
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont acceptées (jpg, png, webp...)"));
    }
  },
});
