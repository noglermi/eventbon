"use client";

import { useMemo, useState } from "react";
import { AddTileDialog } from "./AddTileDialog";
import { Cart } from "./Cart";
import { initialCart, productTiles, tileGroups } from "./mock-data";
import { PaymentPanel } from "./PaymentPanel";
import { TileGroup } from "./TileGroup";
import type { CartItem, ProductTileData, TileGroupName } from "./types";

type OpenGroups = Record<TileGroupName, boolean>;

const defaultOpenGroups: OpenGroups = { Drinks: true, Food: true, Desserts: true, Other: true };

export function SalesTerminal() {
  const [openGroups, setOpenGroups] = useState<OpenGroups>(defaultOpenGroups);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [received, setReceived] = useState(20);
  const [dialogGroup, setDialogGroup] = useState<TileGroupName | null>(null);

  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  function toggleGroup(group: TileGroupName) {
    setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  function addProduct(product: ProductTileData) {
    setCartItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function increaseItem(productId: string) {
    setCartItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item));
  }

  function decreaseItem(productId: string) {
    setCartItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0));
  }

  return (
    <main className="min-h-screen bg-[#f3f4ef] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-6 px-6 py-6 xl:px-8">
        <header className="flex items-center justify-between rounded-[2rem] bg-white px-7 py-5 shadow-sm ring-1 ring-slate-200/70">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">eventBon</p>
            <h1 className="mt-1 text-4xl font-black tracking-normal text-slate-950">Sales Terminal</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Active event</p>
            <p className="mt-1 text-2xl font-black text-slate-950">Summer Fest</p>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_380px] xl:grid-cols-[280px_minmax(0,1fr)_420px]">
          <aside className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <p className="px-2 text-sm font-bold uppercase tracking-widest text-slate-400">Tile groups</p>
            <div className="mt-5 space-y-3">
              {tileGroups.map((group) => {
                const groupClass = openGroups[group] ? "bg-slate-950 text-white shadow-lg" : "bg-slate-100 text-slate-700 hover:bg-slate-200";
                return (
                  <button key={group} type="button" onClick={() => toggleGroup(group)} className={"flex min-h-16 w-full items-center justify-between rounded-2xl px-4 text-left text-lg font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + groupClass} aria-expanded={openGroups[group]}>
                    <span>{group}</span>
                    <span className="text-2xl">{openGroups[group] ? "-" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70 xl:p-6">
            <div className="mb-6 flex items-end justify-between gap-5 px-1">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Sales tiles</p>
                <h2 className="mt-1 text-3xl font-black tracking-normal text-slate-950">Tap to add vouchers</h2>
              </div>
              <p className="max-w-xs text-right text-base font-semibold text-slate-500">Mock data only. Tiles are editable in place later.</p>
            </div>

            <div className="space-y-7 overflow-y-auto pr-1 lg:max-h-[calc(100vh-12rem)]">
              {tileGroups.map((group) => (
                <TileGroup key={group} group={group} products={productTiles.filter((product) => product.group === group)} isOpen={openGroups[group]} onToggle={() => toggleGroup(group)} onSelectProduct={addProduct} onAddTile={setDialogGroup} />
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <Cart items={cartItems} onIncrease={increaseItem} onDecrease={decreaseItem} />
            <PaymentPanel total={total} received={received} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} onReceivedChange={setReceived} />
          </aside>
        </div>
      </div>

      <AddTileDialog group={dialogGroup} onClose={() => setDialogGroup(null)} />
    </main>
  );
}
