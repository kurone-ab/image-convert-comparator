export enum ImageMimeType {
  png = 'image/png',
  jpg = 'image/jpg',
  jpeg = 'image/jpeg',
  gif = 'image/gif',
  webp = 'image/webp',
}

export const imageMimeTypes = Object.values(ImageMimeType);
export const isImageMimeType = (type: string): type is ImageMimeType => {
  return imageMimeTypes.includes(type as ImageMimeType);
};