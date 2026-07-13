import { LegalPage } from "@/components/legal/LegalPage";

export default function SupportPage() {
  return (
    <LegalPage
      title="Support / Problem melden"
      intro="Supportinformationen fuer den geschlossenen eventBon Windows Pilot."
      sections={[
        {
          title: "Supportkontakt",
          items: [
            "TODO: support email",
            "TODO: emergency pilot contact",
            "TODO: support hours during pilot events",
          ],
        },
        {
          title: "System requirements",
          items: [
            "Windows 10 or Windows 11",
            "Chrome or Edge",
            "QZ Tray installed and running",
            "Brother TD-4000 installed in Windows",
            "Stable internet connection during online pilot operation",
          ],
        },
        {
          title: "When reporting a problem",
          items: [
            "Event name",
            "Windows version",
            "Browser and version",
            "Printer model and paper size",
            "Whether QZ Tray was connected",
            "Short description of what happened",
          ],
        },
      ]}
    />
  );
}
