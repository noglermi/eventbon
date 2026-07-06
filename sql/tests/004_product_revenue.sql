SELECT
    si.name_snapshot AS produkt,
    SUM(si.quantity) AS anzahl,
    ROUND(SUM(si.quantity * si.price_cents_snapshot) / 100.0, 2) AS umsatz_euro
FROM sale_items si
GROUP BY si.name_snapshot
ORDER BY umsatz_euro DESC;