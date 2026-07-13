import { InfoSection, LegalPage } from "@/components/legal/LegalPage";

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" intro="Angaben gemäß § 5 ECG und § 24 Mediengesetz">
      <InfoSection>
        <address className="not-italic">
          <p className="font-black text-slate-950">EO-SOL GmbH</p>
          <p>Andreas Hofer Stra&szlig;e 23</p>
          <p>6020 Innsbruck</p>
          <p>&Ouml;sterreich</p>
        </address>
      </InfoSection>

      <InfoSection title="Firmenbuchnummer">
        <p>FN 441153f</p>
      </InfoSection>

      <InfoSection title="Vertretungsberechtigter">
        <p>David Putzer</p>
      </InfoSection>

      <InfoSection title="Inhaltlich Verantwortlicher">
        <p>David Putzer</p>
      </InfoSection>

      <InfoSection title="Kontakt">
        <p>
          E-Mail:{" "}
          <a className="font-black text-emerald-700 hover:text-emerald-900" href="mailto:david.putzer@eo-sol.com">
            david.putzer@eo-sol.com
          </a>
        </p>
        <p>
          Internet:{" "}
          <a className="font-black text-emerald-700 hover:text-emerald-900" href="https://www.eventbons.com">
            https://www.eventbons.com
          </a>
        </p>
      </InfoSection>
    </LegalPage>
  );
}
