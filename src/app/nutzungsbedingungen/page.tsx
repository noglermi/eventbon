import { InfoSection, LegalPage, NoticeBox } from "@/components/legal/LegalPage";

export default function NutzungsbedingungenPage() {
  return (
    <LegalPage title="Nutzungsbedingungen" intro="EventBon ist eine kostenpflichtige Anwendung zur Bonierung bei Veranstaltungen.">
      <InfoSection>
        <p>Die Software dient der Unterstuetzung der Bonierung und Verkaufsabwicklung bei Veranstaltungen.</p>
        <p>
          EventBon ist keine Registrierkasse und ersetzt keine gesetzlich vorgeschriebenen steuerlichen, buchhalterischen
          oder veranstaltungsrechtlichen Systeme.
        </p>
        <p>Die Nutzer sind selbst dafuer verantwortlich, saemtliche gesetzlichen Vorschriften einzuhalten.</p>
      </InfoSection>

      <InfoSection title="Verfuegbarkeit und Weiterentwicklung">
        <p>
          EO-SOL GmbH stellt EventBon als regulaer verfuegbares Produkt bereit. Eine jederzeit unterbrechungsfreie
          oder fehlerfreie Verfuegbarkeit kann dennoch nicht garantiert werden.
        </p>
        <p>Technische Aenderungen, Wartungsarbeiten und Weiterentwicklungen koennen jederzeit erfolgen.</p>
      </InfoSection>

      <InfoSection title="Verantwortung der Nutzer">
        <p>
          Die Nutzer sind fuer geeignete Geraete, Browser, Drucker und eine funktionierende Internetverbindung selbst
          verantwortlich.
        </p>
        <p>Mit der Nutzung von EventBon erklaeren sich die Nutzer mit diesen Nutzungsbedingungen einverstanden.</p>
      </InfoSection>

      <NoticeBox>
        Diese Nutzungsbedingungen enthalten produktive Grundinformationen und muessen vor breiter Skalierung rechtlich
        final geprueft und ergaenzt werden.
      </NoticeBox>
    </LegalPage>
  );
}
