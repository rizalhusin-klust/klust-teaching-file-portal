import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, 'uploads');

export async function uploadFile(courseId, fileName, folder, buffer, mimeType) {
  const useFirebase = process.env.NODE_ENV === 'production' || process.env.DB_TYPE === 'firestore';

  if (useFirebase) {
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp();
      }
      const bucket = admin.storage().bucket();
      const folderPath = folder ? `${folder}/` : '';
      const destination = `courses/${courseId}/${folderPath}${fileName}`;
      const file = bucket.file(destination);
      
      await file.save(buffer, {
        metadata: {
          contentType: mimeType || 'application/octet-stream',
        },
        public: true,
      });

      // Construct and return the public HTTP URL
      return `https://storage.googleapis.com/${bucket.name}/${destination}`;
    } catch (error) {
      console.error("Firebase Storage Upload Error:", error);
      throw error;
    }
  } else {
    // Local storage path
    const targetFolder = folder ? path.join(uploadsDir, folder) : uploadsDir;
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    const filePath = path.join(targetFolder, fileName);
    await fs.promises.writeFile(filePath, buffer);
    
    // Return relative URL for static serving
    const relativeUrl = `/uploads/${folder ? folder + '/' : ''}${fileName}`;
    return relativeUrl;
  }
}

export async function deleteFile(relativeOrAbsoluteUrl) {
  const useFirebase = process.env.NODE_ENV === 'production' || process.env.DB_TYPE === 'firestore';

  if (useFirebase) {
    if (relativeOrAbsoluteUrl.startsWith('https://storage.googleapis.com/')) {
      try {
        if (admin.apps.length === 0) {
          admin.initializeApp();
        }
        const bucket = admin.storage().bucket();
        // Parse destination path from URL
        // Format: https://storage.googleapis.com/<bucket-name>/<path>
        const urlParts = relativeOrAbsoluteUrl.split(`${bucket.name}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          const file = bucket.file(filePath);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
          }
        }
      } catch (error) {
        console.error("Firebase Storage File Deletion Error:", error);
      }
    }
  } else {
    // Local file deletion
    // Extract relative path (e.g. "/uploads/somefile.pdf" -> "somefile.pdf")
    const relativePath = relativeOrAbsoluteUrl.replace(/^\/uploads\//, '');
    const filePath = path.join(uploadsDir, relativePath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Local File Deletion Error:", error);
      }
    }
  }
}
