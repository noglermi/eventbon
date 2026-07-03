# Project Charter

## Product

eventBon is the simplest voucher printing system for events.

It helps event teams sell vouchers, calculate cash change, print vouchers in the browser, and produce a simple sales summary.

## Mission

Sell vouchers.

Calculate change.

Print vouchers.

Generate a simple sales summary.

Nothing else.

## Non-Goals

eventBon is not:

- a cash register
- POS software
- accounting software
- inventory management
- ERP
- restaurant software

The product must not drift into general point-of-sale, finance, stock, restaurant, or enterprise operations features.

## Target Use Case

eventBon is for a single event where staff sell voucher products from a simple terminal. A voucher product can represent a drink, food item, dessert, or other event item. Staff build a cart, confirm the payment method, print vouchers, and continue serving the next guest.

eventBon itself can be booked for a defined event usage period. That booking may include a preparation period, event period, post-event access period, and optional paid extension.

The eventBon rental payment is separate from Bon sales. eventBon does not process event visitor payments as a cash register.

## Design Principles

### Simple for the User

The sales terminal is the product. Users should not need training, setup knowledge, or back-office navigation during active sales.

### Scalable in the Architecture

The system should remain small in the interface while being prepared for multi-tenant operation, hosted deployment, and future payment integrations.

### Invisible Complexity

Tenant separation, storage, deployment, permissions, and payment readiness belong in the architecture. They should not make the selling flow harder.

Future offline readiness also belongs in the architecture. If an offline-capable version is introduced, the booked usage period must be represented as a local license period so the app can run without internet during the booked time window. After expiry, sales access should stop while statistics and export can remain read-only for a defined grace period.

## Scope Control

Every proposed feature should be checked against the mission:

- Does it help sell vouchers?
- Does it help calculate change?
- Does it help print vouchers?
- Does it help generate a simple sales summary?

If the answer is no, the feature is outside the product scope.
