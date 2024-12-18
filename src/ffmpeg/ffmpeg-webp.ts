import { ImageMimeType, isImageMimeType } from '@/enums/image-mime-type';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { message } from 'antd';

export interface TranscodeOptions {
  quality: number;
  lossless: boolean;
}

type Thread = 'single' | 'multi';

const singleThread = new FFmpeg();
const loadSingleThreadFFmpeg = async () => {
  await singleThread.load({
    coreURL: `${import.meta.env.VITE_R2_HOST}/ffmpeg/single/ffmpeg-core.js`,
    wasmURL: `${import.meta.env.VITE_R2_HOST}/ffmpeg/single/ffmpeg-core.wasm`,
  });
  return singleThread;
};
const multiThread = new FFmpeg();
const loadMultiThreadFFmpeg = async () => {
  await multiThread.load({
    coreURL: `${import.meta.env.VITE_R2_HOST}/ffmpeg/multi/ffmpeg-core.js`,
    wasmURL: `${import.meta.env.VITE_R2_HOST}/ffmpeg/multi/ffmpeg-core.wasm`,
    workerURL: await toBlobURL(`${import.meta.env.VITE_R2_HOST}/ffmpeg/multi/ffmpeg-core.worker.js`, 'text/javascript'),
  });
  return multiThread;
};

export const prepareFFmpeg = () => Promise.all([loadSingleThreadFFmpeg(), loadMultiThreadFFmpeg()]);

const getFFmpeg = (thread: Thread) => {
  const ffmpeg = thread === 'multi' ? multiThread : singleThread;
  if (!ffmpeg.loaded) {
    void message.error('FFmpeg not loaded');
    throw new Error('FFmpeg not loaded');
  }
  return ffmpeg;
};

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

const decideThread = (file: File): Thread => {
  if (!isImageMimeType(file.type)) return 'single';
  const { type } = file;
  if (type === ImageMimeType.png) return 'single';
  return 'multi';
};

const writeImage = async (image: File) => {
  const ffmpeg = getFFmpeg(decideThread(image));
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
  const ffmpeg = await getFFmpeg(decideThread(image));
  await writeImage(image);
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
