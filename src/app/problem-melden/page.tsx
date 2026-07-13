import { InfoSection, LegalPage } from "@/components/legal/LegalPage";

const supportMailto = "mailto:nastasia.sushchenko@eo-sol.com?subject=EventBon%20Pilot%20%E2%80%93%20Problemmeldung";

export default function ProblemMeldenPage() {
  return (
    <LegalPage title="Problem melden" intro="Vielen Dank, dass Sie uns helfen, EventBon zu verbessern.">
      <InfoSection title="Bitte beschreiben Sie möglichst genau">
        <ul className="grid gap-2 pl-5">
          <li className="list-disc">Was wollten Sie tun?</li>
          <li className="list-disc">Was ist passiert?</li>
          <li className="list-disc">Welche Fehlermeldung wurde angezeigt?</li>
          <li className="list-disc">Welchen Browser und welches Ger&auml;t verwenden Sie?</li>
          <li className="list-disc">Kann das Problem reproduziert werden?</li>
          <li className="list-disc">Optional: Screenshot oder Foto anh&auml;ngen.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Supportkontakt">
        <p className="font-black text-slate-950">Anastasiia Sushchenko</p>
        <p>
          <a className="font-black text-emerald-700 hover:text-emerald-900" href={supportMailto}>
            nastasia.sushchenko@eo-sol.com
          </a>
        </p>
        <p>Ein Ticketsystem oder eine Uploadfunktion ist derzeit noch nicht erforderlich.</p>
        <div>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            href={supportMailto}
          >
            E-Mail an den Support senden
          </a>
        </div>
      </InfoSection>
    </LegalPage>
  );
}
