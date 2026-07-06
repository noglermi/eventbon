SELECT
    s.created_at,
    s.payment_method,
    ROUND(s.total_cents / 100.0, 2) AS gesamt_euro,
    ROUND(s.cash_received_cents / 100.0, 2) AS erhalten_euro,
    ROUND(s.change_cents / 100.0, 2) AS rueckgeld_euro
FROM sales s
ORDER BY s.created_at DESC
LIMIT 20;