export type PrintMode = "single_vouchers" | "combined_voucher";

export type PaymentMethod = "cash" | "manual_card";

export type Tenant = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Organizer = {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  createdAt: string;
};

export type Event = {
  id: string;
  organizerId: string | null;
  tenantId: string | null;
  name: string;
  startsAt: string;
  endsAt: string;
  accessUntil: string;
  printMode: PrintMode;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  tenantId: string;
  eventId: string;
  name: string;
  priceCents: number;
  groupKey: string;
  color: string;
  icon: string;
  imageUrl: string | null;
  imageCropZoom: number;
  imageCropX: number;
  imageCropY: number;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: string;
  tenantId: string;
  eventId: string;
  totalCents: number;
  paymentMethod: PaymentMethod;
  cashReceivedCents: number | null;
  changeCents: number | null;
  status: string;
  createdAt: string;
};

export type SaleItem = {
  id: string;
  tenantId: string;
  saleId: string;
  productId: string | null;
  nameSnapshot: string;
  groupKeySnapshot: string;
  priceCentsSnapshot: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: string;
};
