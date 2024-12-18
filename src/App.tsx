import { Button, Col, Flex, InputNumber, message, Row, Switch, Typography, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

function App() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<ConvertedImage[]>([]);

  const [lossless, setLossless] = useState(false);
  const [qualityStep, setQualityStep] = useState(5);

  const [ffmpeg] = useState(new FFmpeg());

  const loadFFmpeg = async () => {
    setLoading(true);
    await ffmpeg.load({
      coreURL: await toBlobURL(`/scripts/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`/scripts/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setLoading(false);
  };

  const start = async (): Promise<void> => {
    if (!image) {
      return void message.error('Please select an image');
    }
    if (!ffmpeg.loaded) {
      await loadFFmpeg();
    }
    setLoading(true);
    await ffmpeg.writeFile(image.name, await convertToUint8Array(image));
    const outputs = await Promise.allSettled(
      Array.from({ length: qualityStep }, (_, i) => {
        const quality = (100 / qualityStep) * (i + 1);
        const outputFileName = `${removeExtension(image.name)}-q${quality}.webp`;
        return convert(ffmpeg, {
          inputName: image.name,
          outputName: outputFileName,
          quality,
          lossless,
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
            accept={acceptImageTypes.join(',')}
            beforeUpload={(file) => {
              if (!file || !acceptImageTypes.includes(file.type)) return;
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
            key={output.name}
          >
            <Flex vertical>
              <img
                src={output.url}
                alt={output.name}
                width="100%"
              />
              <Typography.Text>
                {output.name}
                <br />
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

const acceptImageTypes = ['image/png', 'image/jpg', 'image/jpeg'];

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

const removeExtension = (fileName: string) => {
  const name = fileName.split('.');
  name.pop();
  return name.join('.');
};

const convert = async (
  ffmpeg: FFmpeg,
  {
    inputName,
    outputName,
    quality,
    lossless,
  }: {
    inputName: string;
    outputName: string;
    quality: number;
    lossless: boolean;
  },
): Promise<ConvertedImage> => {
  try {
    const runArgs = ['-i', inputName, '-c:v', 'libwebp', '-c:a', 'copy'];
    if (lossless) {
      runArgs.push('-lossless', '1');
    }
    runArgs.push('-quality', quality.toString());
    runArgs.push(outputName);
    console.log(runArgs);
    await ffmpeg.exec(runArgs);
    console.log('done');
    const fileData = await ffmpeg.readFile(outputName);
    const data = new Uint8Array(fileData as ArrayBuffer);
    const blob = new Blob([data], { type: 'image/webp' });
    return {
      url: URL.createObjectURL(blob),
      name: outputName,
      quality,
      size: blob.size,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

interface ConvertedImage {
  url: string;
  name: string;
  quality: number;
  size: number;
}
