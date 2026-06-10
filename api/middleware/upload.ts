import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarUploadDir = path.resolve(__dirname, '../../uploads/avatars');
const imageUploadDir = path.resolve(__dirname, '../../uploads/images');

[avatarUploadDir, imageUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const createStorage = (uploadDir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'));
  }
};

const uploadAvatar = multer({
  storage: createStorage(avatarUploadDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

const uploadImage = multer({
  storage: createStorage(imageUploadDir),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

export { uploadAvatar, uploadImage };
