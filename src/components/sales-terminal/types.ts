export type Language = "de" | "en";
export type TileGroupName = "Drinks" | "Food" | "Desserts" | "Other";
export type PaymentMethod = "cash" | "card_manual";
export type PrintMode = "single_vouchers" | "combined_voucher";

export type LocalizedText = Record<Language, string>;

export type ImageCrop = {
  zoom: number;
  x: number;
  y: number;
};

export type ProductTileData = {
  id: string;
  name: LocalizedText;
  price: number;
  group: TileGroupName;
  icon?: string;
  image?: string;
  imageFile?: File;
  imageCrop?: ImageCrop;
  color: string;
  textColor?: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type EventSettings = {
  name: LocalizedText;
  dateFrom: string;
  dateTo: string;
  printMode: PrintMode;
};

export type ActiveHelperSession = {
  invitationId: string;
  helperName: string;
  station: string | null;
};
