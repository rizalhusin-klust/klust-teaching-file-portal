import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let google = null;
let drive = null;
let rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '';
const isLiveDrive = !!(process.env.GOOGLE_APPLICATION_CREDENTIALS && rootFolderId);

const mockRoot = process.env.APP_DATA_PATH ? path.join(process.env.APP_DATA_PATH, 'uploads') : path.resolve(__dirname, 'uploads');
fs.mkdirSync(mockRoot, { recursive: true });

async function initDrive() {
  if (drive) return drive;
  if (!isLiveDrive) {
    console.log("[DRIVE SERVICE] Running in LOCAL MOCK MODE. Storage path:", mockRoot);
    return null;
  }
  
  try {
    const googleapis = await import('googleapis');
    google = googleapis.google;
    
    const keyPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!fs.existsSync(keyPath)) {
      console.warn(`[DRIVE SERVICE] Warning: Credentials file not found at ${keyPath}. Falling back to LOCAL mode.`);
      return null;
    }
    
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    drive = google.drive({ version: 'v3', auth });
    console.log("[DRIVE SERVICE] Successfully authenticated with Google Drive API.");
    return drive;
  } catch (err) {
    console.error("[DRIVE SERVICE] Failed to initialize Google Drive API, using local storage fallback:", err.message);
    return null;
  }
}

export async function getSubfolderByName(name, parentId) {
  const activeDrive = await initDrive();
  if (!activeDrive) {
    const relativeTarget = path.join(parentId, name);
    const fullPath = path.join(mockRoot, relativeTarget);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return relativeTarget.replace(/\\/g, '/');
    }
    return null;
  }
  
  const query = `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await activeDrive.files.list({
    q: query,
    spaces: 'drive',
    fields: 'files(id, name)',
    pageSize: 1
  });
  const files = res.data.files || [];
  return files.length > 0 ? files[0].id : null;
}

export async function createFolder(name, parentId) {
  const activeDrive = await initDrive();
  if (!activeDrive) {
    const relativeTarget = path.join(parentId, name);
    const fullPath = path.join(mockRoot, relativeTarget);
    fs.mkdirSync(fullPath, { recursive: true });
    return relativeTarget.replace(/\\/g, '/');
  }
  
  const fileMetadata = {
    name: name,
    parents: [parentId],
    mimeType: 'application/vnd.google-apps.folder'
  };
  const folder = await activeDrive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });
  return folder.data.id;
}

export async function getOrCreateNestedFolders(pathSegments) {
  let currentParentId = isLiveDrive ? rootFolderId : 'root';
  for (const segment of pathSegments) {
    const cleanSegment = segment.trim();
    let existingId = await getSubfolderByName(cleanSegment, currentParentId);
    if (existingId) {
      currentParentId = existingId;
    } else {
      currentParentId = await createFolder(cleanSegment, currentParentId);
    }
  }
  return currentParentId;
}

export async function uploadFileToDrive(buffer, filename, mimeType, parentFolderId) {
  const activeDrive = await initDrive();
  if (!activeDrive) {
    const relativeFilepath = path.join(parentFolderId, filename);
    const fullPath = path.join(mockRoot, relativeFilepath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    
    return {
      fileId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      webViewLink: `/uploads/${relativeFilepath.replace(/\\/g, '/')}`,
      localPath: relativeFilepath.replace(/\\/g, '/')
    };
  }
  
  const stream = new (await import('stream')).PassThrough();
  stream.end(buffer);
  
  const fileMetadata = {
    name: filename,
    parents: [parentFolderId]
  };
  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: stream
  };
  
  const file = await activeDrive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });
  
  try {
    await activeDrive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
  } catch (err) {
    console.error(`[DRIVE SERVICE] Failed to make file ${file.data.id} public:`, err.message);
  }
  
  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink,
    localPath: null
  };
}
