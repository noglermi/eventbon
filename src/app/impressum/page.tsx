import { LegalPage } from "@/components/legal/LegalPage";

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      intro="Pflichtangaben fuer den eventBon Windows Pilot. Diese Seite ist ein Platzhalter bis zur finalen rechtlichen Pruefung."
      sections={[
        {
          title: "Anbieter",
          items: [
            "TODO: responsible company",
            "TODO: business address",
            "TODO: contact email",
            "TODO: company register details",
            "TODO: VAT details",
          ],
        },
        {
          title: "Kontakt",
          items: [
            "TODO: support email",
            "TODO: legal contact email",
          ],
        },
      ]}
    />
  );
}
