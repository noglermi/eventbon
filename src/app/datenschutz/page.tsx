import { InfoSection, LegalPage, NoticeBox } from "@/components/legal/LegalPage";

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung" intro="Der Schutz personenbezogener Daten ist uns wichtig.">
      <InfoSection>
        <p>
          Bei der Nutzung von EventBon werden ausschlie&szlig;lich jene personenbezogenen Daten verarbeitet, die f&uuml;r die
          Bereitstellung, Sicherheit und Weiterentwicklung der Anwendung erforderlich sind.
        </p>
        <p>Die Daten werden ausschlie&szlig;lich f&uuml;r den Betrieb von EventBon verwendet und nicht verkauft.</p>
      </InfoSection>

      <InfoSection title="Verarbeitete Daten">
        <p>Je nach Nutzung k&ouml;nnen insbesondere folgende Daten verarbeitet werden:</p>
        <ul className="grid gap-2 pl-5">
          <li className="list-disc">Benutzer- und Kontodaten</li>
          <li className="list-disc">Veranstaltungsdaten</li>
          <li className="list-disc">Produktdaten</li>
          <li className="list-disc">Verkaufs- und Transaktionsdaten</li>
          <li className="list-disc">technische Protokoll- und Fehlerdaten</li>
        </ul>
      </InfoSection>

      <InfoSection title="Technische Dienstleister">
        <p>EventBon verwendet unter anderem folgende technische Dienstleister:</p>
        <ul className="grid gap-2 pl-5">
          <li className="list-disc">Vercel (Hosting)</li>
          <li className="list-disc">Supabase (Datenbank, Authentifizierung und Storage)</li>
        </ul>
      </InfoSection>

      <InfoSection title="Rechte betroffener Personen">
        <p>Betroffene Personen haben im Rahmen der DSGVO insbesondere folgende Rechte:</p>
        <ul className="grid gap-2 pl-5">
          <li className="list-disc">Auskunft</li>
          <li className="list-disc">Berichtigung</li>
          <li className="list-disc">L&ouml;schung</li>
          <li className="list-disc">Einschr&auml;nkung der Verarbeitung</li>
          <li className="list-disc">Daten&uuml;bertragbarkeit</li>
          <li className="list-disc">Widerspruch</li>
        </ul>
      </InfoSection>

      <InfoSection title="Verantwortlicher">
        <address className="not-italic">
          <p className="font-black text-slate-950">EO-SOL GmbH</p>
          <p>Andreas Hofer Stra&szlig;e 23</p>
          <p>6020 Innsbruck</p>
          <p>&Ouml;sterreich</p>
        </address>
        <p>
          E-Mail:{" "}
          <a className="font-black text-emerald-700 hover:text-emerald-900" href="mailto:david.putzer@eo-sol.com">
            david.putzer@eo-sol.com
          </a>
        </p>
      </InfoSection>

      <NoticeBox>
        Diese Datenschutzerkl&auml;rung ist eine vorl&auml;ufige Fassung f&uuml;r die Pilotphase und wird vor dem
        &ouml;ffentlichen Produktstart rechtlich gepr&uuml;ft und erg&auml;nzt.
      </NoticeBox>
    </LegalPage>
  );
}
