import { ImageMimeType, isImageMimeType } from '@/enums/image-mime-type';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export interface TranscodeOptions {
  quality: number;
  lossless: boolean;
}

const singleThreadFFmpeg = new FFmpeg();
const loadSingleThread = async () => {
  await singleThreadFFmpeg.load({
    coreURL: await toBlobURL('/ffmpeg/single/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL('/ffmpeg/single/ffmpeg-core.wasm', 'application/wasm'),
  });
};
const multiTreadFFmpeg = new FFmpeg();
const loadMultiThread = async () => {
  await multiTreadFFmpeg.load({
    coreURL: await toBlobURL('/ffmpeg/multi/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL('/ffmpeg/multi/ffmpeg-core.wasm', 'application/wasm'),
    workerURL: await toBlobURL('/ffmpeg/multi/ffmpeg-core.worker.js', 'text/javascript'),
  });
};

const getFFmpeg = async (type: ImageMimeType) => {
  if (type === ImageMimeType.png) {
    if (!singleThreadFFmpeg.loaded) {
      await loadSingleThread();
    }
    return singleThreadFFmpeg;
  } else {
    if (!multiTreadFFmpeg.loaded) {
      await loadMultiThread();
    }
    return multiTreadFFmpeg;
  }
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

const writeImage = async (image: File) => {
  const { type } = image;
  if (!isImageMimeType(type)) {
    throw new Error(`Unsupported image type: ${type}`);
  }
  const ffmpeg = await getFFmpeg(type);
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
