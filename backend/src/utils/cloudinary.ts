import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder = "domtom-connect/avatars",
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

export const uploadAttachment = (
  file: Express.Multer.File,
  folder = "domtom-connect/attachments",
): Promise<{ url: string; type: "image" | "document" }> => {
  return new Promise((resolve, reject) => {
    const isImage = file.mimetype.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(isImage
          ? { transformation: [{ width: 1200, crop: "limit" }], format: "webp" }
          : {}),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result!.secure_url,
          type: isImage ? "image" : "document",
        });
      },
    );
    stream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (url: string): Promise<void> => {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return;
    const afterUpload = parts.slice(uploadIndex + 1);
    const withoutVersion = afterUpload[0]?.match(/^v\d+$/)
      ? afterUpload.slice(1)
      : afterUpload;
    const publicId = withoutVersion.join("/").replace(/\.[^/.]+$/, "");
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[Cloudinary] Erreur suppression:", err);
  }
};

// Avatars — images uniquement, 5MB
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(null, false); // reject silencieusement, pas d'erreur
  },
});

// Pièces jointes — images + docs, 10MB, max 5 fichiers
// fileFilter retourne false au lieu de throw pour éviter le crash multer
export const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Ne pas lancer d'erreur — juste ignorer le fichier non supporté
      cb(null, false);
    }
  },
});
