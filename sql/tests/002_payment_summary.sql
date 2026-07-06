SELECT
    payment_method,
    COUNT(*) AS anzahl_verkaeufe,
    ROUND(SUM(total_cents) / 100.0, 2) AS umsatz_euro
FROM sales
GROUP BY payment_method
ORDER BY payment_method;