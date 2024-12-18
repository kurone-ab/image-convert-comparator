import { transcodeToWebP } from '@/ffmpeg/ffmpeg-webp';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Flex, Typography } from 'antd';

export interface TranscodeTarget {
  quality: number;
  lossless: boolean;
  original: File;
}

interface Props {
  target: TranscodeTarget;
}

export default function TranscodeImage({ target }: Props) {
  const outputRequest = useSuspenseQuery({
    queryKey: ['transcode', target],
    queryFn: async () => {
      const output = await transcodeToWebP(target.original, { lossless: target.lossless, quality: target.quality });
      return {
        url: URL.createObjectURL(output),
        size: output.size,
      };
    },
  });

  return (
    <Flex
      vertical
      justify="center"
      align="center"
    >
      {outputRequest.status === 'success' ? (
        <>
          <img
            src={outputRequest.data.url}
            alt=""
            width="100%"
          />
          <Typography.Text>
            {(outputRequest.data.size / 1024).toFixed(2)} kb
            <br />
            {target.quality} %
          </Typography.Text>
        </>
      ) : null}
    </Flex>
  );
}
