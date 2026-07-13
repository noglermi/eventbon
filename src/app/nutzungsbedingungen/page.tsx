import { InfoSection, LegalPage, NoticeBox } from "@/components/legal/LegalPage";

export default function NutzungsbedingungenPage() {
  return (
    <LegalPage title="Nutzungsbedingungen" intro="EventBon befindet sich derzeit in einer Pilotphase.">
      <InfoSection>
        <p>Die Software dient der Unterst&uuml;tzung der Bonierung und Verkaufsabwicklung bei Veranstaltungen.</p>
        <p>
          EventBon ist keine Registrierkasse und ersetzt keine gesetzlich vorgeschriebenen steuerlichen, buchhalterischen
          oder veranstaltungsrechtlichen Systeme.
        </p>
        <p>Die Nutzer sind selbst daf&uuml;r verantwortlich, s&auml;mtliche gesetzlichen Vorschriften einzuhalten.</p>
      </InfoSection>

      <InfoSection title="Pilotphase und Verfügbarkeit">
        <p>
          EO-SOL GmbH &uuml;bernimmt w&auml;hrend der Pilotphase keine Gew&auml;hr f&uuml;r eine jederzeit unterbrechungsfreie
          oder fehlerfreie Verf&uuml;gbarkeit der Software.
        </p>
        <p>Technische &Auml;nderungen, Wartungsarbeiten und Weiterentwicklungen k&ouml;nnen jederzeit erfolgen.</p>
      </InfoSection>

      <InfoSection title="Verantwortung der Nutzer">
        <p>
          Die Nutzer sind f&uuml;r geeignete Ger&auml;te, Browser, Drucker und eine funktionierende Internetverbindung selbst
          verantwortlich.
        </p>
        <p>Mit der Nutzung von EventBon erkl&auml;ren sich die Nutzer mit diesen Nutzungsbedingungen einverstanden.</p>
      </InfoSection>

      <NoticeBox>
        Diese Nutzungsbedingungen sind eine vorl&auml;ufige Fassung f&uuml;r die Pilotphase und werden vor der &ouml;ffentlichen
        Vermarktung rechtlich gepr&uuml;ft.
      </NoticeBox>
    </LegalPage>
  );
}
