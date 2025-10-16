"use client";

import Image from "next/image";

import { getImageUrl } from "@/services/imageHandler";

type ProductImagesProps = {
  images?: string[] | string | null;
};

const ProductImages = ({ images }: ProductImagesProps) => {
  if (!images) return null;

  const imageList = Array.isArray(images) ? images : [images];
  if (imageList.length === 0) return null;

  const primaryImage = imageList[0];
  const secondaryImages = imageList.slice(1);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-64 w-64 overflow-hidden rounded-xl border">
        <Image
          src={getImageUrl(primaryImage)}
          alt="Product image"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      {secondaryImages.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {secondaryImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative h-16 w-16 overflow-hidden rounded-md border"
            >
              <Image
                src={getImageUrl(image)}
                alt={`Product thumbnail ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
