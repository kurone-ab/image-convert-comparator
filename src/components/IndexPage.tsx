import AsyncBoundary from '@/components/AsyncBoundary';
import { type TranscodeTarget } from '@/components/TranscodeImage';
import { imageMimeTypes, isImageMimeType } from '@/enums/image-mime-type';
import { InboxOutlined } from '@ant-design/icons';
import { Button, Col, Flex, InputNumber, message, Row, Spin, Switch, Typography, Upload } from 'antd';
import { lazy, useState } from 'react';

const TranscodeImage = lazy(() => import('@/components/TranscodeImage'));

interface Props {
  ready: boolean;
}

export default function IndexPage({ ready }: Props) {
  const [image, setImage] = useState<File | null>(null);
  const [targets, setTargets] = useState<TranscodeTarget[]>([]);

  const [lossless, setLossless] = useState(false);
  const [qualityStep, setQualityStep] = useState(5);

  const start = async (): Promise<void> => {
    if (!image) {
      return void message.error('Please select an image');
    }

    setTargets(
      Array.from({ length: qualityStep }, (_, i) => {
        const quality = (100 / qualityStep) * (i + 1);
        return { original: image, quality, lossless };
      }),
    );
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
              disabled={!image}
              loading={!ready}
            >
              Convert
            </Button>
          </Flex>
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        {targets.map((target) => (
          <Col
            span={8}
            key={target.quality}
            style={{ minHeight: 400 }}
          >
            <AsyncBoundary loading={<Spin />}>
              <TranscodeImage target={target} />
            </AsyncBoundary>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
