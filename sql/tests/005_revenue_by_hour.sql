SELECT
    DATE_TRUNC('hour', s.created_at) AS stunde,
    COUNT(*) AS verkaeufe,
    ROUND(SUM(s.total_cents) / 100.0, 2) AS umsatz_euro
FROM sales s
GROUP BY stunde
ORDER BY stunde DESC;