import { ImageMimeType, isImageMimeType } from '@/enums/image-mime-type';
import { FFmpeg } from '@ffmpeg/ffmpeg';

export interface TranscodeOptions {
  quality: number;
  lossless: boolean;
}

const loadSingleThreadFFmpeg = async () => {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: `${import.meta.env.VITE_R2_HOST}/ffmpeg/single/ffmpeg-core.js`,
    wasmURL: `${import.meta.env.VITE_R2_HOST}/ffmpeg/single/ffmpeg-core.wasm`,
  });
  return ffmpeg;
};

const ffmpeg = await loadSingleThreadFFmpeg();

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

const writeImage = async (image: File) => {
  const { type } = image;
  if (!isImageMimeType(type)) {
    throw new Error(`Unsupported image type: ${type}`);
  }
  const dirExists = (await ffmpeg.listDir('/')).some((it) => it.isDir && it.name === 'images');
  if (!dirExists) {
    await ffmpeg.createDir('/images');
  }
  const imageExists = (await ffmpeg.listDir('/images')).some((it) => it.name === image.name);
  if (!imageExists) {
    await ffmpeg.writeFile(image.name, await convertToUint8Array(image));
  }

  return ffmpeg;
};

interface ExecutorArgs extends TranscodeOptions {
  input: string;
  output: string;
}
const createExecutor = ({ input, quality, lossless, output }: ExecutorArgs) => {
  const args = ['-i', input, '-c:v', 'libwebp'];
  args.push('-lossless', lossless ? '1' : '0');
  args.push('-quality', quality.toString());
  args.push(output);
  return args;
};

export const transcodeToWebP = async (image: File, options: TranscodeOptions) => {
  const ffmpeg = await writeImage(image);
  const input = image.name;
  const output = `${image.name.replace(/\.[^/.]+$/, '')}-q${options.quality}-${options.lossless ? 'lossless' : 'lossy'}.webp`;
  const args = createExecutor({
    input,
    output,
    ...options,
  });
  await ffmpeg.exec(args);
  const fileData = await ffmpeg.readFile(output);
  return new Blob([fileData], { type: ImageMimeType.webp });
};
