import { AlertOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Flex, Spin, Typography } from 'antd';

export interface TranscodeTarget {
  quality: number;
  lossless: boolean;
  original: File;
}

interface Props {
  target: TranscodeTarget;
}

export function TranscodeImage({ target }: Props) {
  const outputRequest = useQuery({
    queryKey: ['transcode', target],
    queryFn: async () => {
      const { transcodeToWebP } = await import('@/ffmpeg/ffmpeg-webp');
      const output = await transcodeToWebP(target.original, { lossless: target.lossless, quality: target.quality });
      return {
        url: URL.createObjectURL(output),
        size: output.size,
      }
    },
  });

  return (
    <Flex vertical>
      {outputRequest.status === 'pending' ? (
        <Spin />
      ) : outputRequest.status === 'success' ? (
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
      ) : (
        <AlertOutlined />
      )}
    </Flex>
  );
}
