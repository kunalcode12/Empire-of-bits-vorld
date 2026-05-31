import Link from "next/link";

export const metadata = {
  title: "Terms of Use — Empire of Bits",
  description:
    "Terms governing your access to and use of the Empire of Bits decentralized gaming ecosystem.",
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Top bar */}
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
          >
            Empire of Bits
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/terms-of-use" className="text-gray-900 font-medium">
              Terms of Use
            </Link>
            <Link
              href="/privacy-policy"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Title */}
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">
          Legal
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
          Terms of Use
        </h1>
        <p className="text-base text-gray-600 mb-12">
          Effective May 16, 2026 · Last updated May 16, 2026
        </p>

        <p className="text-lg leading-8 text-gray-700 mb-16">
          These Terms govern your access to and use of the Empire of Bits
          decentralized gaming ecosystem — a reactive, deterministic, real-time
          multiplayer gaming experience anchored by a chess-inspired competitive
          engine and deployed natively on the Solana blockchain.
        </p>

        <section className="prose-section">
          <h2>1. Agreement and scope</h2>

          <h3>1.1 Binding agreement</h3>
          <p>
            These Terms of Use (&ldquo;Terms&rdquo;) constitute a legally
            binding agreement between you (&ldquo;User&rdquo; or
            &ldquo;Player&rdquo;) and Empire of Bits (&ldquo;Platform,&rdquo;
            &ldquo;we,&rdquo; or &ldquo;us&rdquo;), governing your access to and
            use of the Empire of Bits decentralized gaming ecosystem.
          </p>
          <p>
            The ecosystem encompasses: the on-chain reactive game engine,
            cross-game interoperability framework, $EOB token infrastructure,
            NFT and cNFT distribution modules, vesting smart contracts, and the
            streamer-native viewer interaction layer.
          </p>

          <h3>1.2 Acceptance by interaction</h3>
          <p>
            By connecting a cryptographic wallet, initiating any smart contract
            instruction, or accessing the front-end interface at{" "}
            <a
              href="https://www.empireofbits.xyz/"
              target="_blank"
              rel="noopener noreferrer"
            >
              empireofbits.xyz
            </a>{" "}
            or its subdomains, you confirm that you have read, understood, and
            agreed to these Terms in full.
          </p>
          <blockquote>
            <strong>Critical notice.</strong> If you do not accept these Terms,
            you must immediately disconnect your wallet and cease all
            interaction with the Platform. Continued use constitutes binding
            acceptance.
          </blockquote>

          <h2>2. Platform architecture overview</h2>

          <h3>2.1 Reactive deterministic game engine</h3>
          <p>
            Empire of Bits hosts a real-time, deterministic reactive game engine
            built to validate and synchronize competitive multiplayer matches
            natively on the Solana blockchain. Key characteristics include:
          </p>
          <ul>
            <li>
              <strong>On-chain state resolution:</strong> all move validation,
              match logic, and competitive outcomes are written directly to the
              public ledger.
            </li>
            <li>
              <strong>Mobile-first architecture:</strong> optimized for
              low-latency wallet interaction on iOS and Android environments.
            </li>
            <li>
              <strong>External infrastructure dependency:</strong> real-time
              state synchronization relies on Magicblocks protocols and Sonic
              Hypergrid. The Platform makes no guarantees regarding uptime,
              throughput, or finality timelines of these third-party layers.
            </li>
          </ul>

          <h3>2.2 Cross-game interoperability</h3>
          <p>
            The $EOB coin and native Ecosystem NFTs/cNFTs carry utility across
            the full Empire of Bits game library (including Battleship, Chess,
            Axe Arcade, Car Racing, 3D Airplane Simulator, and the Virtual
            World). Asset utility is strictly programmatic and game-bound. The
            Platform does not guarantee perpetual cross-game utility, secondary
            market liquidity, or fixed token conversion rates.
          </p>

          <h3>2.3 Streamer-native on-chain streaming</h3>
          <p>
            Empire of Bits introduces a first-of-its-kind on-chain streaming
            model where competitive matches are broadcast live and remain fully
            synchronized with smart contract state. Streamers participate as
            verifiable competitive players within a transparent, real-time
            on-chain environment.
          </p>
          <p>
            <strong>Viewer interaction layer:</strong> Audience participants may
            submit verified on-chain transactions to trigger rule-bound,
            predefined in-game effects during live matches. All viewer actions
            are governed by smart contract logic and are immutably recorded.
          </p>
          <blockquote>
            <strong>Public telemetry waiver.</strong> By playing, streaming, or
            interacting as a viewer, you consent to the public broadcast of
            your game selections, transaction signatures, and wallet identifiers
            across international data feeds.
          </blockquote>

          <h2>3. Wallet architecture and jurisdictional compliance</h2>

          <h3>3.1 Non-custodial architecture</h3>
          <p>
            The Platform operates on an exclusively non-custodial basis. Empire
            of Bits does not hold, control, or assume fiduciary responsibility
            for any digital assets, private keys, or wallet states. You bear
            sole responsibility for the security of your private keys and seed
            phrases. The Platform cannot reverse, recover, or modify any
            on-chain transaction.
          </p>

          <h3>3.2 Eligibility and sanctions compliance</h3>
          <p>
            By using the Platform, you represent that you are a legally
            competent adult in your jurisdiction, and that you are not a
            resident, citizen, or entity of any territory subject to
            comprehensive sanctions administered by OFAC, the EU, the UN
            Security Council, or equivalent regulatory bodies. Use of VPNs or
            obfuscation tools to circumvent geographic restrictions is strictly
            prohibited.
          </p>

          <h2>4. Token economics, gas fees, and vesting</h2>

          <h3>4.1 Solana network fees</h3>
          <p>
            All on-chain interactions — including match initiation, move
            submission, $EOB claims, NFT mints, and vesting executions — require
            Solana network fees (&ldquo;Gas Fees&rdquo;). These fees are
            dynamically set by network conditions and flow entirely to the
            Solana validator network. Empire of Bits receives no portion of
            these fees and has no authority over their pricing.
          </p>

          <h3>4.2 Vesting smart contracts</h3>
          <p>
            Token allocations distributed via the Empire of Bits Vesting Smart
            Contract are governed exclusively by immutable on-chain code.
            Vesting parameters — including Start Time, Cliff Duration, and End
            Time — are fixed at initialization and cannot be altered,
            accelerated, or revoked by any party, including the Platform&apos;s
            core developers.
          </p>

          <h3>4.3 Asset classification</h3>
          <p>
            The $EOB coin, ecosystem tokens, and digital collectibles are
            consumer-utility assets designed for in-game participation and
            platform governance. Nothing in the Platform&apos;s materials
            constitutes financial advice, investment brokerage, or a securities
            offering. Digital assets are highly speculative. You assume the
            complete risk of economic depreciation.
          </p>

          <h2>5. Prohibited conduct</h2>
          <p>
            To preserve competitive integrity and platform security, the
            following are strictly prohibited:
          </p>
          <ul>
            <li>
              <strong>Automated exploitation:</strong> using bots, macro-scripts,
              AI decision agents, or modified clients to manipulate matchmaking,
              simulate fake users, or distort ELO rankings.
            </li>
            <li>
              <strong>Smart contract abuse:</strong> DDoS attacks against RPC
              nodes, flooding Anchor contracts with invalid inputs, or attempts
              to extract unfair transaction ordering or lock state variables.
            </li>
            <li>
              <strong>Vulnerability exploitation:</strong> using discovered code
              anomalies or zero-day bugs for economic gain instead of reporting
              them to Platform security channels immediately.
            </li>
            <li>
              <strong>Viewer interaction abuse:</strong> submitting fraudulent
              or repeated on-chain viewer transactions to disrupt live match
              state outside predefined rule bounds.
            </li>
          </ul>

          <h2>6. Intellectual property</h2>

          <h3>6.1 Open-source components</h3>
          <p>
            Core technical architectures (including the Main Engine, Vesting
            Module, NFT Framework, and game-specific branches) are maintained
            in public GitHub repositories under their respective open-source
            licenses (MIT, Apache 2.0). Your rights to use, copy, or fork these
            components are governed exclusively by those licenses.
          </p>

          <h3>6.2 Proprietary assets</h3>
          <p>
            All proprietary intellectual property — including visual artwork,
            Virtual World spatial environments, front-end UI designs, branding,
            logos, and narrative content — is the exclusive property of Empire
            of Bits and its technology partners. Unauthorized reproduction or
            commercial use is strictly prohibited.
          </p>

          <h2>7. Disclaimers and risk assumptions</h2>
          <p>
            The Empire of Bits Platform is provided &ldquo;as-is&rdquo; and
            &ldquo;as-available&rdquo; without warranties of any kind. To the
            maximum extent permitted by law, all warranties of merchantability,
            fitness for purpose, security integrity, and process
            synchronization are expressly disclaimed.
          </p>
          <p>
            By using the Platform, you acknowledge and accept the following
            risks:
          </p>
          <ul>
            <li>
              <strong>Smart contract risk:</strong> decentralized contracts may
              contain logical exploits or bugs that result in irreversible loss
              of digital assets.
            </li>
            <li>
              <strong>Blockchain finality risk:</strong> network forks, RPC
              failures, or Solana consensus congestion may cause match
              cancellation, incorrect scoreboards, or lost gas fees.
            </li>
            <li>
              <strong>Regulatory risk:</strong> legal frameworks governing
              digital assets and play-to-earn models are volatile. Legislative
              changes may restrict or terminate Platform availability in your
              jurisdiction.
            </li>
            <li>
              <strong>Streaming infrastructure risk:</strong> live match
              synchronization depends on third-party streaming and scaling
              infrastructure not under Platform control.
            </li>
          </ul>

          <h2>8. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Empire of Bits, its
            founders, contributors, and agents shall not be liable for any
            consequential, indirect, incidental, special, or punitive damages
            arising from use of the Platform. This includes but is not limited
            to: loss of tokens, NFTs, or private key credentials; match
            cancellation or score errors; third-party exploitation; or
            streaming infrastructure failure.
          </p>
          <p>
            The Platform&apos;s aggregate liability for any claim arising from
            these Terms shall not exceed{" "}
            <strong>one hundred United States dollars ($100.00 USD)</strong>.
          </p>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Empire of Bits, its core
            contributors, and operational agents from any third-party claims,
            losses, or expenses (including legal fees) arising from: your
            unauthorized use of Platform smart contracts; your violation of
            these Terms or applicable law; or your infringement of third-party
            intellectual property or data rights.
          </p>

          <h2>10. Governing law and dispute resolution</h2>

          <h3>10.1 Governing law</h3>
          <p>
            These Terms are governed by the substantive laws of the Cayman
            Islands, without regard to conflicts of law principles.
          </p>

          <h3>10.2 Mandatory arbitration</h3>
          <p>
            Any unresolved dispute shall be submitted to binding arbitration
            under the Arbitration Rules of the Singapore International
            Arbitration Centre (SIAC). The arbitration shall be conducted by a
            single arbitrator, seated in Singapore, in the English language.
            The arbitrator&apos;s decision shall be final and enforceable in
            any court of competent jurisdiction.
          </p>

          <h2>11. Amendments</h2>
          <p>
            Empire of Bits reserves the right to modify these Terms at any
            time. Changes take effect upon publication, indicated by an updated
            &ldquo;Last updated&rdquo; date at the top of this document.
            Continued use of the Platform following any amendment constitutes
            acceptance of the revised Terms.
          </p>

          <h2>12. Contact</h2>
          <p>
            For compliance inquiries, technical documentation, or protocol
            verification:
          </p>
          <ul>
            <li>
              Primary portal:{" "}
              <a
                href="https://www.empireofbits.xyz/"
                target="_blank"
                rel="noopener noreferrer"
              >
                empireofbits.xyz
              </a>
            </li>
            <li>
              Developer repository:{" "}
              <a
                href="https://github.com/kunalcode12/Empire-of-bits-vorld"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/kunalcode12/Empire-of-bits-vorld
              </a>
            </li>
          </ul>
        </section>

        <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between text-sm">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to home
          </Link>
          <Link
            href="/privacy-policy"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Privacy Policy →
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Empire of Bits. All rights reserved.
        </div>
      </footer>

      <style>{`
        .prose-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgb(17 24 39);
          margin-top: 3rem;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }
        .prose-section h3 {
          font-size: 1.0625rem;
          font-weight: 600;
          color: rgb(17 24 39);
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .prose-section p {
          font-size: 1rem;
          line-height: 1.75;
          color: rgb(55 65 81);
          margin-bottom: 1rem;
        }
        .prose-section ul {
          margin-top: 0.5rem;
          margin-bottom: 1.25rem;
          padding-left: 1.25rem;
        }
        .prose-section li {
          font-size: 1rem;
          line-height: 1.75;
          color: rgb(55 65 81);
          margin-bottom: 0.5rem;
          list-style-type: disc;
        }
        .prose-section li::marker {
          color: rgb(156 163 175);
        }
        .prose-section a {
          color: rgb(37 99 235);
          text-decoration: none;
        }
        .prose-section a:hover {
          text-decoration: underline;
        }
        .prose-section strong {
          color: rgb(17 24 39);
          font-weight: 600;
        }
        .prose-section blockquote {
          border-left: 3px solid rgb(229 231 235);
          padding: 0.75rem 0 0.75rem 1.25rem;
          margin: 1.5rem 0;
          color: rgb(75 85 99);
          background: rgb(249 250 251);
          border-radius: 0 0.375rem 0.375rem 0;
        }
        .prose-section blockquote strong {
          display: block;
          margin-bottom: 0.25rem;
          color: rgb(17 24 39);
        }
      `}</style>
    </div>
  );
}
