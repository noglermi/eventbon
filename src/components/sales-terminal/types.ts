export type TileGroupName = "Drinks" | "Food" | "Desserts" | "Other";

export type ProductTileData = {
  id: string;
  name: string;
  price: number;
  group: TileGroupName;
  icon?: string;
  image?: string;
  color: string;
  textColor?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};
