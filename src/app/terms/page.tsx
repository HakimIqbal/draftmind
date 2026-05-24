import { LegalDocument } from '@/components/legal/legal-document';

export const dynamic = 'force-static';
export const metadata = {
  title: 'Terms of Service · DraftMind',
};

export default function TermsPage() {
  return <LegalDocument kind="terms" copies={termsCopies} />;
}

const termsCopies = {
  en: {
    eyebrow: 'Legal / Terms',
    title: 'Terms of Service',
    effectiveLabel: 'Effective',
    effectiveDate: 'May 23, 2026',
    summary: [
      'These Terms of Service govern your access to and use of DraftMind, an AI-assisted Product Requirement Document workspace for product teams.',
      'By accessing DraftMind, you agree to these Terms. If you use DraftMind through a workspace, your workspace administrator may also set additional internal rules.',
      'DraftMind accounts are administrator-managed. Public self-service registration is not available.',
    ],
    sections: [
      {
        title: 'Service Description',
        body: [
          'DraftMind provides tools for drafting, editing, reviewing, sharing, and exporting Product Requirement Documents. The service includes AI-assisted generation and review features that depend on the AI provider configured by a workspace administrator.',
        ],
      },
      {
        title: 'Accounts and Administration',
        body: [
          'Workspace administrators create accounts, assign roles, manage access, reset passwords, and offboard users. You are responsible for keeping your credentials confidential and for all activity under your account.',
        ],
      },
      {
        title: 'Acceptable Use',
        body: [
          'You may use DraftMind only for lawful business, educational, or product-development purposes.',
        ],
        bullets: [
          'Do not bypass access controls, rate limits, or workspace permissions.',
          'Do not upload malicious code or attempt to disrupt the service.',
          'Do not use DraftMind to create unlawful, deceptive, infringing, or abusive material.',
          'Do not scrape, reverse engineer, or systematically extract the service to build a competing product.',
          'Do not share or expose AI provider API keys outside the authorized workspace.',
        ],
      },
      {
        title: 'Workspace Content',
        body: [
          'You retain ownership of PRDs, templates, comments, exports, and other content you create or upload. You grant DraftMind a limited license to host, copy, transmit, render, and process that content only as needed to provide the service.',
        ],
      },
      {
        title: 'AI-Generated Content',
        body: [
          'AI-generated output is a drafting aid. It may be incomplete, inaccurate, or unsuitable for your specific use case. Your team is responsible for reviewing, validating, and approving output before relying on it for product or business decisions.',
        ],
      },
      {
        title: 'Third-Party Providers',
        body: [
          'DraftMind may send relevant prompt and document content to the AI provider configured by your workspace. Your use of those providers is subject to their own terms and policies. Workspace administrators are responsible for providing valid API keys and ensuring appropriate provider use.',
        ],
      },
      {
        title: 'Availability and Security',
        body: [
          'We aim to keep DraftMind reliable, but the service is provided on an as-available basis. Maintenance, provider outages, network issues, or security concerns may affect availability. We may suspend access when required to protect the service, comply with law, or prevent abuse.',
        ],
      },
      {
        title: 'Fees, Suspension, and Termination',
        body: [
          'Free-tier usage may include limits and does not include service-level commitments. Paid features, if offered, are governed by pricing or ordering terms shown at purchase. We or your workspace administrator may suspend or terminate access if these Terms are violated or if continued access creates risk.',
        ],
      },
      {
        title: 'Disclaimers and Liability',
        body: [
          'DraftMind is provided without warranties of accuracy, uninterrupted availability, or fitness for a particular purpose. To the maximum extent permitted by law, DraftMind and its operators are not liable for indirect, incidental, special, consequential, or punitive damages. Our aggregate liability is limited to the greater of the amount paid to DraftMind in the 12 months before the claim or IDR 1,000,000.',
        ],
      },
      {
        title: 'Governing Law and Contact',
        body: [
          'These Terms are governed by the laws of the Republic of Indonesia. Disputes should first be handled through good-faith negotiation. If unresolved, disputes may be settled by BANI arbitration in Jakarta, with matters not subject to arbitration handled by the District Court of South Jakarta. For legal notices, contact legal@draftmind.web.id. For general support, contact support@draftmind.web.id.',
        ],
      },
    ],
    footerNote:
      'These Terms apply to DraftMind users and workspace administrators. Organization-specific access rules may be managed by each workspace administrator.',
  },
  id: {
    eyebrow: 'Legal / Ketentuan',
    title: 'Ketentuan Layanan',
    effectiveLabel: 'Berlaku sejak',
    effectiveDate: '23 Mei 2026',
    summary: [
      'Ketentuan Layanan ini mengatur akses dan penggunaan DraftMind, workspace berbantuan AI untuk membuat Product Requirement Document bagi tim produk.',
      'Dengan mengakses DraftMind, Anda menyetujui Ketentuan ini. Jika Anda menggunakan DraftMind melalui workspace, administrator workspace juga dapat menetapkan aturan internal tambahan.',
      'Akun DraftMind dikelola oleh administrator. Pendaftaran publik mandiri tidak tersedia.',
    ],
    sections: [
      {
        title: 'Deskripsi Layanan',
        body: [
          'DraftMind menyediakan alat untuk membuat, mengedit, meninjau, membagikan, dan mengekspor Product Requirement Document. Layanan mencakup fitur AI generation dan review yang bergantung pada AI provider yang dikonfigurasi oleh administrator workspace.',
        ],
      },
      {
        title: 'Akun dan Administrasi',
        body: [
          'Administrator workspace membuat akun, menetapkan role, mengelola akses, mereset password, dan melakukan offboarding pengguna. Anda bertanggung jawab menjaga kerahasiaan kredensial dan seluruh aktivitas di akun Anda.',
        ],
      },
      {
        title: 'Penggunaan yang Diperbolehkan',
        body: [
          'Anda hanya boleh menggunakan DraftMind untuk tujuan bisnis, pendidikan, atau pengembangan produk yang sah.',
        ],
        bullets: [
          'Jangan melewati kontrol akses, rate limit, atau permission workspace.',
          'Jangan mengunggah kode berbahaya atau mencoba mengganggu layanan.',
          'Jangan menggunakan DraftMind untuk membuat materi ilegal, menipu, melanggar hak, atau abusif.',
          'Jangan melakukan scraping, reverse engineering, atau ekstraksi sistematis untuk membangun produk pesaing.',
          'Jangan membagikan atau mengekspos API key AI provider di luar workspace yang berwenang.',
        ],
      },
      {
        title: 'Konten Workspace',
        body: [
          'Anda tetap memiliki PRD, template, komentar, ekspor, dan konten lain yang Anda buat atau unggah. Anda memberikan DraftMind lisensi terbatas untuk menyimpan, menyalin, mengirim, menampilkan, dan memproses konten tersebut hanya sejauh diperlukan untuk menyediakan layanan.',
        ],
      },
      {
        title: 'Konten yang Dihasilkan AI',
        body: [
          'Output AI adalah alat bantu drafting. Output dapat tidak lengkap, tidak akurat, atau tidak sesuai untuk kebutuhan tertentu. Tim Anda bertanggung jawab meninjau, memvalidasi, dan menyetujui output sebelum digunakan untuk keputusan produk atau bisnis.',
        ],
      },
      {
        title: 'Provider Pihak Ketiga',
        body: [
          'DraftMind dapat mengirim prompt dan konten dokumen yang relevan ke AI provider yang dikonfigurasi workspace. Penggunaan provider tersebut tunduk pada ketentuan dan kebijakan masing-masing provider. Administrator workspace bertanggung jawab menyediakan API key yang valid dan memastikan penggunaan provider sesuai ketentuan.',
        ],
      },
      {
        title: 'Ketersediaan dan Keamanan',
        body: [
          'Kami berupaya menjaga DraftMind tetap andal, tetapi layanan disediakan apa adanya dan sesuai ketersediaan. Maintenance, gangguan provider, masalah jaringan, atau pertimbangan keamanan dapat memengaruhi akses. Kami dapat menangguhkan akses jika diperlukan untuk melindungi layanan, mematuhi hukum, atau mencegah penyalahgunaan.',
        ],
      },
      {
        title: 'Biaya, Penangguhan, dan Pengakhiran',
        body: [
          'Penggunaan free tier dapat memiliki batasan dan tidak termasuk komitmen service-level. Fitur berbayar, jika tersedia, tunduk pada harga atau ketentuan pemesanan yang ditampilkan saat pembelian. Kami atau administrator workspace dapat menangguhkan atau mengakhiri akses jika Ketentuan ini dilanggar atau jika akses berkelanjutan menimbulkan risiko.',
        ],
      },
      {
        title: 'Penafian dan Batasan Tanggung Jawab',
        body: [
          'DraftMind disediakan tanpa jaminan akurasi, ketersediaan tanpa gangguan, atau kesesuaian untuk tujuan tertentu. Sepanjang diizinkan hukum, DraftMind dan operatornya tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau punitif. Total tanggung jawab kami dibatasi pada jumlah yang lebih besar antara pembayaran kepada DraftMind dalam 12 bulan sebelum klaim atau IDR 1.000.000.',
        ],
      },
      {
        title: 'Hukum yang Berlaku dan Kontak',
        body: [
          'Ketentuan ini diatur oleh hukum Republik Indonesia. Sengketa harus terlebih dahulu diselesaikan melalui negosiasi dengan itikad baik. Jika tidak terselesaikan, sengketa dapat diselesaikan melalui arbitrase BANI di Jakarta, dengan perkara yang tidak tunduk pada arbitrase ditangani oleh Pengadilan Negeri Jakarta Selatan. Untuk pemberitahuan hukum, hubungi legal@draftmind.web.id. Untuk dukungan umum, hubungi support@draftmind.web.id.',
        ],
      },
    ],
    footerNote:
      'Ketentuan ini berlaku untuk pengguna dan administrator workspace DraftMind. Aturan akses khusus organisasi dapat dikelola oleh masing-masing administrator workspace.',
  },
} as const;
