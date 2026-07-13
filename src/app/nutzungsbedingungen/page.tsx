import { LegalPage } from "@/components/legal/LegalPage";

export default function NutzungsbedingungenPage() {
  return (
    <LegalPage
      title="Nutzungsbedingungen"
      intro="Vorlaeufige Nutzungsbedingungen fuer den geschlossenen eventBon Windows Pilot. Finale rechtliche Pruefung ist erforderlich."
      sections={[
        {
          title: "Pilotumfang",
          items: [
            "eventBon Windows Pilot is a closed pilot release.",
            "Officially supported: Windows 10, Windows 11, Chrome, Edge, QZ Tray, Brother TD-4000.",
            "iPad, Android, Stripe activation, and additional certified printers are not part of this pilot scope.",
          ],
        },
        {
          title: "Organizer duties",
          items: [
            "Organizers must verify product names and prices before active sales.",
            "Organizers must verify allergen information before publishing or printing menus.",
            "Organizers must only upload images they are allowed to use.",
          ],
        },
        {
          title: "TODO legal details",
          items: [
            "TODO: contract partner",
            "TODO: liability limitations",
            "TODO: pilot availability terms",
            "TODO: support process",
          ],
        },
      ]}
    />
  );
}
