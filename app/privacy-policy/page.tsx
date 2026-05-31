import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Empire of Bits",
  description:
    "How Empire of Bits processes, routes, and retains data across its decentralized ecosystem.",
};

export default function PrivacyPolicyPage() {
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
            <Link
              href="/terms-of-use"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms of Use
            </Link>
            <Link href="/privacy-policy" className="text-gray-900 font-medium">
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
          Privacy Policy
        </h1>
        <p className="text-base text-gray-600 mb-12">
          Effective May 16, 2026 · Last updated May 16, 2026
        </p>

        <p className="text-lg leading-8 text-gray-700 mb-16">
          This Privacy Policy explains how Empire of Bits processes, routes, and
          retains data collected through your interaction with our decentralized
          ecosystem — including mobile gaming dApps, web portals, the reactive
          chess-based game engine, on-chain viewer interaction layers, and
          vesting smart contracts.
        </p>

        <section className="prose-section">
          <h2>1. Scope and architectural paradigm</h2>

          <h3>1.1 Overview</h3>
          <p>
            This Privacy Policy (&ldquo;Policy&rdquo;) provides technical
            transparency about how Empire of Bits (&ldquo;Platform,&rdquo;
            &ldquo;we,&rdquo; or &ldquo;us&rdquo;) processes, routes, and
            retains data collected through your interaction with our
            decentralized ecosystem.
          </p>

          <h3>1.2 Blockchain immutability</h3>
          <p>
            Empire of Bits operates on the public Solana blockchain. Unlike
            conventional gaming platforms with centralized databases,
            transaction data committed to the Solana ledger is permanent,
            globally distributed, and publicly visible. We do not have the
            technical capacity to modify, restrict, or delete data once it is
            recorded on-chain.
          </p>
          <blockquote>
            <strong>Core principle.</strong> On-chain data is irreversible. By
            interacting with our smart contracts, you acknowledge and accept
            this immutability.
          </blockquote>

          <h2>2. Data we collect</h2>

          <h3>2.1 Public blockchain data (non-PII)</h3>
          <p>
            When you connect a non-custodial wallet to the Platform, the
            application reads publicly available on-chain state, including:
          </p>
          <ul>
            <li>Your Solana public key (wallet address).</li>
            <li>Historical $EOB and utility token balances.</li>
            <li>NFT and cNFT ownership configurations.</li>
            <li>
              Cryptographic transaction signatures (match outcomes, vesting
              executions, viewer interaction transactions).
            </li>
          </ul>

          <h3>2.2 Gameplay telemetry and reactive state logs</h3>
          <p>
            To power real-time competitive match synchronization and the
            on-chain streaming ecosystem, the Platform temporarily processes:
          </p>
          <ul>
            <li>
              <strong>Gameplay inputs:</strong> move selections, chess vectors,
              directional coordinates, and timestamped action sequences.
            </li>
            <li>
              <strong>Competitive metrics:</strong> match histories, win/loss
              ratios, ELO rank calculations, and automated completion rates.
            </li>
            <li>
              <strong>Streaming and viewer data:</strong> live spectator
              transaction markers, predefined vote selections, and rule-bound
              state modification events submitted during broadcasts.
            </li>
            <li>
              <strong>Hardware and connection metrics:</strong> device OS
              (iOS/Android), client latency logs, frame rendering parameters,
              and RPC node telemetry.
            </li>
          </ul>

          <h3>2.3 Voluntarily provided support data</h3>
          <p>
            The Platform does not collect standard Personally Identifiable
            Information (PII) such as email addresses, phone numbers, or legal
            identities. However, if you contact our development team via
            external channels (Discord, X/Twitter, or GitHub), we may retain
            platform handles and support correspondence to resolve technical
            inquiries.
          </p>

          <h2>3. How we use data</h2>
          <p>
            We process collected data strictly for the following purposes:
          </p>
          <ul>
            <li>
              <strong>Smart contract execution:</strong> authenticating wallet
              connections, verifying asset ownership to unlock cross-game
              titles, and coordinating matchmaking queues.
            </li>
            <li>
              <strong>Engine optimization:</strong> analyzing latency,
              stress-testing concurrent performance across Sonic Hypergrid
              infrastructure, and improving mobile application stability.
            </li>
            <li>
              <strong>Anti-cheat and security:</strong> evaluating match
              telemetry to detect bots, Sybil attacks, or unauthorized
              client-side state manipulation.
            </li>
            <li>
              <strong>Streaming integrity:</strong> verifying on-chain viewer
              interaction submissions and ensuring rule-bound compliance during
              live broadcast sessions.
            </li>
            <li>
              <strong>Product development:</strong> evaluating retention rates
              and match completion data to inform new game titles and token
              economic models.
            </li>
          </ul>

          <h2>4. Data disclosure and third-party interfaces</h2>

          <h3>4.1 Public blockchain visibility</h3>
          <p>
            All on-chain transactions, match resolutions, and digital asset
            interactions are permanently recorded to the public Solana ledger.
            This data is universally accessible to any block explorer, analytics
            platform, or node operator globally.
          </p>

          <h3>4.2 Infrastructure partners</h3>
          <p>
            To maintain low-latency performance, our systems interface with
            external infrastructure including Vercel (hosting), Magicblocks
            (state scaling), and Sonic Hypergrid (throughput optimization).
            These partners may temporarily log network telemetry solely for
            routing stability. We do not share personal data with these
            services.
          </p>

          <h3>4.3 Legal and regulatory disclosure</h3>
          <p>
            We comply with legitimate legal orders where applicable. However,
            due to our non-custodial, non-PII architecture, our off-chain
            systems contain no user-identifying data to disclose to authorities
            beyond wallet addresses already publicly visible on-chain.
          </p>

          <h2>5. International data flows</h2>

          <h3>5.1 Global distribution</h3>
          <p>
            The Solana blockchain and associated infrastructure are globally
            distributed. Data committed to the public ledger is processed across
            an international validator network. Temporary off-chain telemetry
            caches may be routed through cloud servers in multiple
            jurisdictions.
          </p>

          <h3>5.2 GDPR and CCPA considerations</h3>
          <p>
            If you access the Platform from the European Economic Area or
            California, your statutory rights are bounded by the technical
            realities of public blockchain architecture:
          </p>
          <ul>
            <li>
              <strong>Right to erasure:</strong> we cannot delete public key
              records or transaction signatures committed on-chain. These are
              inherently immutable.
            </li>
            <li>
              <strong>Off-chain caches:</strong> for transient telemetry,
              support logs, or analytics data held in temporary cloud storage,
              you may request inspection or deletion by contacting our
              development team through official channels.
            </li>
            <li>
              <strong>Data portability:</strong> on-chain data is natively
              portable and accessible via any Solana block explorer.
            </li>
          </ul>

          <h2>6. Security measures</h2>
          <p>
            The Platform applies the following protections to off-chain data:
          </p>
          <ul>
            <li>
              <strong>Complete key separation:</strong> we do not collect,
              store, or transmit private cryptographic keys or seed phrases at
              any point.
            </li>
            <li>
              <strong>Smart contract auditing:</strong> core transaction
              architectures, vesting contracts, and NFT minting modules undergo
              rigorous code review and stress testing.
            </li>
            <li>
              <strong>Telemetry access controls:</strong> off-chain gameplay and
              streaming telemetry is access-controlled and retained only as
              long as operationally necessary.
            </li>
          </ul>

          <h2>7. Minors</h2>
          <p>
            The Platform is designed exclusively for adults and is not directed
            at individuals under the age of 13. We do not knowingly collect data
            from minors. If we become aware that a minor under 13 has submitted
            data through off-chain support channels, we will take immediate
            steps to delete those records from our systems.
          </p>

          <h2>8. Policy amendments</h2>
          <p>
            We reserve the right to update this Policy to reflect new platform
            features, smart contract deployments, or evolving international
            privacy regulations. Updates take effect immediately upon
            publication, indicated by a revised &ldquo;Last updated&rdquo; date
            at the top of this document.
          </p>

          <h2>9. Contact</h2>
          <p>
            For data governance inquiries, off-chain cache deletion requests, or
            privacy compliance questions:
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
            href="/terms-of-use"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Terms of Use →
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
