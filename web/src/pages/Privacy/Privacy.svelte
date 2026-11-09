<script lang="ts">
  import LegalPage from '#/components/LegalPage.svelte'
</script>

<LegalPage title="Privacy Policy">
  <p>
    qlip is a clipboard-sharing service available at qlip.uk, operated by Ivan Popov, an independent
    developer based in Ukraine. I am responsible for the personal data processed by qlip. For
    privacy questions or requests, contact
    <a href="mailto:qlip.uk@proton.me">qlip.uk@proton.me</a>.
  </p>

  <section>
    <h2>What you share</h2>
    <p>
      qlip reads your clipboard when you choose to share, not continuously in the background. Your
      content is encrypted between the connected devices during transfer. We do not store it on our
      servers or keep a history of what you share.
    </p>
    <p>
      Received content stays on the page temporarily. The recipient can copy, save, or share it, and
      we cannot delete those copies. Share room links only with people you intend to connect with: a
      link does not verify the recipient's identity.
    </p>
  </section>

  <section>
    <h2>Information used to run the service</h2>
    <p>
      We and our service provider, Cloudflare, process technical information needed to operate and
      protect qlip. This includes IP addresses, browser and network information, room codes, random
      browser identifiers, connection events, and security check results.
    </p>
    <p>
      Some of this information may appear in technical logs used to investigate errors, maintain
      security, and prevent abuse. These logs do not contain copies of your shared content.
    </p>
    <p>
      Connecting devices may reveal your IP address and network information to the other
      participant. We do not verify the identity of people joining a room.
    </p>
    <p>
      This technical information is necessary to provide the service. If your browser or network
      prevents its processing, you may be unable to connect or share content. No account is
      required, and you are not legally required to provide information to use qlip.
    </p>
  </section>

  <section>
    <h2>Cloudflare</h2>
    <p>
      Cloudflare provides qlip's hosting, connection infrastructure, and security services. When a
      transfer passes through Cloudflare's relay servers, its content remains encrypted between the
      connected devices. Cloudflare processes connection information, including IP addresses and
      data transfer amounts, to provide these services.
    </p>
    <p>
      We also use Cloudflare Turnstile to detect bots and prevent abuse. It may perform background
      checks using information such as your IP address, browser and device characteristics, and
      information about your visit to qlip.uk. Cloudflare also processes this information to improve
      its bot detection.
    </p>
    <p>
      Automated security checks may restrict access when suspicious activity is detected. We do not
      use automated decision-making that produces legal or similarly significant effects on users.
    </p>
    <p>
      For more information, see Cloudflare's
      <a href="https://www.cloudflare.com/turnstile-privacy-policy/">Turnstile Privacy Addendum</a>
      and <a href="https://www.cloudflare.com/privacypolicy/">Privacy Policy</a>.
    </p>
  </section>

  <section>
    <h2>Cookies and browser storage</h2>
    <p>
      We save a random identifier in your browser to recognise it when connecting devices. It
      remains until you clear the site's storage or your browser removes it.
    </p>
    <p>
      qlip does not set its own cookies or use advertising or analytics trackers. Cloudflare's
      security services may use browser storage or security cookies as described in its
      <a href="https://www.cloudflare.com/cookie-policy/">Cookie Policy</a>. Blocking essential
      browser features may prevent the service from working.
    </p>
  </section>

  <section>
    <h2>How we use your information</h2>
    <p>
      We process technical information to provide sharing, maintain connections, protect the
      service, and resolve problems. If you contact us by email, we use your address and message to
      respond. We do not sell personal data or use shared content for advertising.
    </p>
    <p>
      Where applicable data protection law requires a legal basis, we rely on performance of our
      agreement with you to provide the service, and our legitimate interests in maintaining
      security, preventing abuse, resolving technical problems, and responding to enquiries.
    </p>
  </section>

  <section>
    <h2>How long information is kept</h2>
    <p>
      Connection information is used while devices are communicating. We do not keep a history of
      transferred content. The random browser identifier remains in your browser until the site's
      storage is cleared or removed.
    </p>
    <p>
      Technical logs may remain after a connection ends. Where Cloudflare Workers Logs are enabled,
      their retention follows Cloudflare's applicable settings, as described in its
      <a href="https://developers.cloudflare.com/workers/observability/logs/workers-logs/">
        documentation</a
      >. Cloudflare may retain other security and network records according to its
      <a href="https://www.cloudflare.com/privacypolicy/">Privacy Policy</a>.
    </p>
    <p>
      We keep support emails for as long as needed to handle enquiries, resolve related issues, and
      meet applicable legal obligations.
    </p>
  </section>

  <section>
    <h2>Who handles your information</h2>
    <p>
      We use Cloudflare to operate and protect qlip and an email service provider to handle support
      messages. Technical connection information may also be shared with the other participant as
      part of establishing a connection. We may disclose information when required by law.
    </p>
    <p>
      Our service providers may process information outside your country, including in countries
      with different data protection laws. Where required, international transfers are subject to
      appropriate safeguards. Cloudflare describes its transfer arrangements, including standard
      contractual clauses where applicable, in its
      <a href="https://www.cloudflare.com/cloudflare-customer-dpa/"> Data Processing Addendum</a>.
    </p>
  </section>

  <section>
    <h2>Your choices and rights</h2>
    <p>
      You can stop sharing by closing the page, remove the saved identifier by clearing site data,
      and manage clipboard permissions through your browser settings. These actions do not erase
      service logs or copies already received by another device.
    </p>
    <p>
      Depending on applicable law, you may have the right to access, correct, delete, or receive a
      copy of your personal data, restrict its processing, or object to processing based on
      legitimate interests. You may also have the right to data portability and to lodge a complaint
      with a competent data protection authority.
    </p>
    <p>
      To exercise your rights, contact
      <a href="mailto:qlip.uk@proton.me">qlip.uk@proton.me</a>. We may need information to verify
      your request and locate relevant records. Some requests may be subject to legal limitations.
    </p>
  </section>

  <section>
    <h2>Changes to this policy</h2>
    <p>
      We may update this policy when our practices change. Updates will be published on this page
      with a revised date. For the rules governing use of the service, see our
      <a href="/terms">Terms of Use</a>.
    </p>
  </section>
</LegalPage>
