import { useEffect } from 'react';

export function usePreloadImages(images: string | string[]) {
  useEffect(() => {
    const preloads = Array<string>()
      .concat(images)
      .map((src) => {
        const image = new Image();
        image.src = src;
        return image;
      });

    return () => {
      preloads.map((img) => (img.src = '#'));
    };
  }, [images]);
}
