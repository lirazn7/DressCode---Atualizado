import { storage } from '../database/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * ☁️ UPLOAD PARA O FIREBASE STORAGE
 * Substitui a antiga conversão para Base64 (que inflava os documentos do Firestore).
 * Recebe a URI local da imagem e o caminho de destino no bucket, retorna a URL pública.
 */
export const uploadImageAsync = async (uri, path) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);

  return await getDownloadURL(storageRef);
};
