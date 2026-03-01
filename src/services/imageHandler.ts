const STATIC_RESOURCE = `${process.env.NEXT_PUBLIC_BACKEND ?? ""}/static`;

export const getImageUrl = (imageName: string) =>
  `${STATIC_RESOURCE}/image/${imageName}`;

export const getMobileAppQrURL = () =>
  `${STATIC_RESOURCE}/mobile-app-qr-code.png`;
