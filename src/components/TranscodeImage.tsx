import { useVips } from '@/hooks/use-vips';
import { transcodeToWebP } from '@/lib/transcode';
import { useSuspenseQuery } from '@tanstack/react-query';

export interface TranscodeTarget {
  quality: number;
  lossless: boolean;
  original: File;
}

interface Props {
  target: TranscodeTarget;
}

export default function TranscodeImage({ target }: Props) {
  const vips = useVips();

  const outputRequest = useSuspenseQuery({
    queryKey: ['transcode', target],
    queryFn: async () => {
      const output = await transcodeToWebP(vips, target.original, {
        lossless: target.lossless,
        quality: target.quality,
      });
      return {
        url: URL.createObjectURL(output),
        size: output.size,
      };
    },
  });

  return (
    <div className="flex flex-col items-center">
      {outputRequest.status === 'success' ? (
        <>
          <img
            src={outputRequest.data.url}
            alt=""
            width="100%"
          />
          <p>{(outputRequest.data.size / 1024).toFixed(2)} kb</p>
          <p>{target.quality} %</p>
        </>
      ) : null}
    </div>
  );
}
