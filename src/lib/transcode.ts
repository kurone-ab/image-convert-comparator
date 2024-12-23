import { IMAGE_MIME_TYPE, MIME_TYPES } from '@mantine/dropzone';
import Vips from 'wasm-vips';

export interface TranscodeOption {
  quality: number;
  lossless: boolean;
  preset?: Vips.ForeignWebpPreset;
}

const convertToUint8Array = (file: File) => {
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(e.target.result));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const transcodeToWebP = async (vips: typeof Vips, image: File, options: TranscodeOption) => {
  if (!(IMAGE_MIME_TYPE as string[]).includes(image.type)) throw new Error('Invalid image type');

  const imageData = await convertToUint8Array(image);
  const inputImage = vips.Image.newFromBuffer(imageData);
  const outputBuffer = inputImage.webpsaveBuffer({
    Q: options.quality,
    lossless: options.lossless,
  });
  return new Blob([outputBuffer], { type: MIME_TYPES.webp });
};
