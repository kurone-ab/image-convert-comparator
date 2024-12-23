import AsyncBoundary from '@/components/AsyncBoundary';
import { TranscodeOption } from '@/lib/transcode';
import { Button, Flex, Group, Loader, NumberInput, SegmentedControl, Switch, Text, Title } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { MediaImage, MediaImageXmark, UploadSquare } from 'iconoir-react';
import { lazy, useState } from 'react';

const VipsProvider = lazy(() => import('@/lib/vips'));
const TranscodeImage = lazy(() => import('@/components/TranscodeImage'));

export default function IndexPage() {
  const [targetImage, setTargetImage] = useState<File>();

  const [transcodeOptions, setTranscodeOptions] = useState<TranscodeOption[]>([]);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      qualityStep: 5,
      lossless: false,
      preset: '0',
    },
    validate: {
      qualityStep: (value) => (value <= 0 || value > 10 ? 'Value must be between 1 and 10' : null),
    },
  });

  const convert = form.onSubmit((values) => {
    console.log(values);
    setTranscodeOptions(
      Array.from({ length: values.qualityStep }, (_, idx) => {
        return {
          lossless: values.lossless,
          quality: (100 / values.qualityStep) * (idx + 1),
          preset: Number(values.preset),
        };
      }),
    );
  });

  return (
    <Flex
      direction="column"
      p="md"
      gap="md"
    >
      <Title order={1}>Image Convert Comparator</Title>
      <form
        onSubmit={convert}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <Dropzone
            onDrop={(files) => {
              const file = files[0];
              setTargetImage(file);
            }}
            onReject={() => {
              notifications.show({
                color: 'red',
                message: 'File type not supported',
                autoClose: 3000,
              });
            }}
            accept={IMAGE_MIME_TYPE}
          >
            <Group
              justify="center"
              gap="xl"
              mih={220}
              className="pointer-events-none"
            >
              <Dropzone.Accept>
                <UploadSquare />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <MediaImageXmark />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <MediaImage />
              </Dropzone.Idle>

              <div>
                <Text
                  size="xl"
                  inline
                >
                  Drag images here or click to select files
                </Text>
                <Text
                  size="sm"
                  c="dimmed"
                  inline
                  mt={7}
                >
                  Attach as many files as you like, each file should not exceed 5mb
                </Text>
              </div>
            </Group>
          </Dropzone>
        </div>
        <div className="flex flex-col gap-3">
          <NumberInput
            {...form.getInputProps('qualityStep')}
            label="Quality Step"
            key={form.key('qualityStep')}
          />
          <Switch
            {...form.getInputProps('lossless')}
            labelPosition="left"
            label="Lossless"
            key={form.key('lossless')}
          />
          <SegmentedControl
            {...form.getInputProps('preset')}
            data={[
              { value: '0', label: 'Default' },
              { value: '1', label: 'Picture' },
              { value: '2', label: 'Photo' },
              { value: '3', label: 'Drawing' },
              { value: '4', label: 'Icon' },
              { value: '5', label: 'Text'},
            ]}
          />
          <Button
            type="submit"
            disabled={!targetImage}
          >
            Convert
          </Button>
        </div>
      </form>
      {targetImage ? (
        <VipsProvider>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {transcodeOptions.map((option) => (
              <AsyncBoundary
                loading={<Loader />}
                key={option.quality}
              >
                <TranscodeImage target={{ ...option, original: targetImage }} />
              </AsyncBoundary>
            ))}
          </div>
        </VipsProvider>
      ) : null}
    </Flex>
  );
}
