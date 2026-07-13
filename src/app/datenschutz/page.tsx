import { LegalPage } from "@/components/legal/LegalPage";

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutz"
      intro="Datenschutzhinweise fuer den geschlossenen eventBon Windows Pilot. Diese Inhalte benoetigen finale rechtliche Pruefung."
      sections={[
        {
          title: "Verantwortliche Stelle",
          items: [
            "TODO: responsible company",
            "TODO: business address",
            "TODO: data protection contact email",
          ],
        },
        {
          title: "Hosting und Datenverarbeitung",
          items: [
            "TODO: hosting provider",
            "TODO: Supabase as data processor",
            "TODO: Vercel as hosting/data processor",
            "TODO: QZ Tray local print bridge notes",
          ],
        },
        {
          title: "Speicherfristen",
          items: [
            "TODO: organizer account retention periods",
            "TODO: event data retention periods",
            "TODO: sales data retention periods",
            "TODO: uploaded image retention periods",
          ],
        },
      ]}
    />
  );
}
