import { ImageMimeType, isImageMimeType } from '@/enums/image-mime-type';
import Vips from 'wasm-vips';

export interface TranscodeOptions {
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

export const transcodeToWebP = async (vips: typeof Vips, image: File, options: TranscodeOptions) => {
  if (!isImageMimeType(image.type)) throw new Error('Invalid image type');

  const imageData = await convertToUint8Array(image);
  const inputImage = vips.Image.newFromBuffer(imageData);
  const outputBuffer = inputImage.webpsaveBuffer({
    Q: options.quality,
    lossless: options.lossless,
  });
  return new Blob([outputBuffer], { type: ImageMimeType.webp });
};
