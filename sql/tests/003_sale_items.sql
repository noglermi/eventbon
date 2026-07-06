SELECT
    s.created_at,
    s.payment_method,
    si.name_snapshot,
    si.quantity,
    ROUND(si.price_cents_snapshot / 100.0, 2) AS einzelpreis_euro,
    ROUND((si.quantity * si.price_cents_snapshot) / 100.0, 2) AS positionswert_euro
FROM sales s
JOIN sale_items si
ON s.id = si.sale_id
ORDER BY s.created_at DESC;