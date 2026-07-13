import { InfoSection, LegalPage } from "@/components/legal/LegalPage";

export default function NutzungsbedingungenPage() {
  return (
    <LegalPage title="Nutzungsbedingungen" intro="EventBon ist eine kostenpflichtige Anwendung zur Bonierung bei Veranstaltungen.">
      <InfoSection>
        <p>Die Software dient der Unterstützung der Bonierung und Verkaufsabwicklung bei Veranstaltungen.</p>
        <p>
          EventBon ist keine Registrierkasse und ersetzt keine gesetzlich vorgeschriebenen steuerlichen, buchhalterischen
          oder veranstaltungsrechtlichen Systeme.
        </p>
        <p>Die Nutzer sind selbst dafür verantwortlich, sämtliche gesetzlichen Vorschriften einzuhalten.</p>
      </InfoSection>

      <InfoSection title="Verfügbarkeit und Weiterentwicklung">
        <p>
          EO-SOL GmbH stellt EventBon als regulär verfügbares Produkt bereit. Eine jederzeit unterbrechungsfreie
          oder fehlerfreie Verfügbarkeit kann dennoch nicht garantiert werden.
        </p>
        <p>Technische Änderungen, Wartungsarbeiten und Weiterentwicklungen können jederzeit erfolgen.</p>
      </InfoSection>

      <InfoSection title="Verantwortung der Nutzer">
        <p>
          Die Nutzer sind für geeignete Geräte, Browser, Drucker und eine funktionierende Internetverbindung selbst
          verantwortlich.
        </p>
        <p>Mit der Nutzung von EventBon erklären sich die Nutzer mit diesen Nutzungsbedingungen einverstanden.</p>
      </InfoSection>
    </LegalPage>
  );
}
