import { imageMimeTypes, isImageMimeType } from '@/enums/image-mime-type';
import { InboxOutlined } from '@ant-design/icons';
import { Button, Col, Flex, InputNumber, message, Row, Switch, Typography, Upload } from 'antd';
import { useState } from 'react';

function App() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<ConvertedImage[]>([]);

  const [lossless, setLossless] = useState(false);
  const [qualityStep, setQualityStep] = useState(5);

  const start = async (): Promise<void> => {
    if (!image) {
      return void message.error('Please select an image');
    }
    setLoading(true);
    const { transcodeToWebP } = await import('@/ffmpeg/ffmpeg-webp');
    const outputs = await Promise.allSettled(
      Array.from({ length: qualityStep }, (_, i) => {
        const quality = (100 / qualityStep) * (i + 1);
        return transcodeToWebP(image, { quality, lossless }).then((output) => {
          return {
            url: URL.createObjectURL(output),
            quality,
            size: output.size,
          };
        });
      }),
    );
    setOutputs(
      outputs
        .filter((it): it is PromiseFulfilledResult<ConvertedImage> => it.status === 'fulfilled')
        .map((output) => output.value),
    );
    setLoading(false);
  };

  return (
    <Flex vertical>
      <Typography.Title level={1}>Image Convert Comparator</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Upload.Dragger
            accept={imageMimeTypes.join(',')}
            beforeUpload={(file) => {
              console.log(file.type);
              if (!file || !isImageMimeType(file.type)) return false;
              setImage(file);
              return false;
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
          </Upload.Dragger>
        </Col>
        <Col span={12}>
          <Flex
            vertical
            align="start"
            gap={12}
          >
            <Switch
              checked={lossless}
              onChange={setLossless}
              checkedChildren="Lossless"
              unCheckedChildren="Lossy"
            />
            <InputNumber
              min={1}
              max={10}
              value={qualityStep}
              onChange={(value) => {
                if (value === null) return;
                setQualityStep(value);
              }}
            />
            <Button
              type="primary"
              onClick={start}
              loading={loading}
            >
              Convert
            </Button>
          </Flex>
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        {outputs.map((output) => (
          <Col
            span={8}
            key={output.url}
          >
            <Flex vertical>
              <img
                src={output.url}
                alt=""
                width="100%"
              />
              <Typography.Text>
                {(output.size / 1024).toFixed(2)} kb
                <br />
                {output.quality} %
              </Typography.Text>
            </Flex>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}

export default App;

interface ConvertedImage {
  url: string;
  quality: number;
  size: number;
}
