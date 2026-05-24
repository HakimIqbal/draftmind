import { LegalDocument } from '@/components/legal/legal-document';

export const dynamic = 'force-static';
export const metadata = {
  title: 'Privacy Policy · DraftMind',
};

export default function PrivacyPage() {
  return <LegalDocument kind="privacy" copies={privacyCopies} />;
}

const privacyCopies = {
  en: {
    eyebrow: 'Legal / Privacy',
    title: 'Privacy Policy',
    effectiveLabel: 'Effective',
    effectiveDate: 'May 23, 2026',
    summary: [
      'DraftMind is an AI-assisted Product Requirement Document workspace for product teams. This Privacy Policy explains what information we collect, how we use it, and how you can ask us to manage it.',
      'DraftMind workspaces are administered by workspace administrators. Accounts are created and managed by administrators rather than public self-service registration.',
      'We do not sell personal data. We use data only to provide, secure, support, and improve DraftMind.',
    ],
    sections: [
      {
        title: 'Information We Collect',
        body: ['We collect information needed to operate DraftMind and keep workspaces secure.'],
        bullets: [
          'Account data: name, email address, profile image, role, and workspace membership.',
          'Authentication data: session tokens, login events, password-change status, and security logs handled through our authentication provider.',
          'Workspace content: PRDs, templates, comments, attachments, AI-generated drafts, and share links.',
          'Operational data: IP address, browser type, timestamps, error events, and audit logs.',
          'Provider configuration: AI provider settings and encrypted API keys configured by a workspace administrator.',
        ],
      },
      {
        title: 'How We Use Information',
        body: ['We use information to provide the service and protect workspace data.'],
        bullets: [
          'Authenticate users and manage access permissions.',
          'Create, edit, review, share, and export PRD content.',
          'Run AI-assisted generation and review using the AI provider selected by the workspace.',
          'Detect abuse, investigate security events, and maintain audit trails.',
          'Communicate operational notices such as password resets, incidents, or important service updates.',
        ],
      },
      {
        title: 'AI Provider Processing',
        body: [
          'When you use AI features, DraftMind may transmit relevant prompts, PRD content, and metadata to the AI provider configured by your workspace administrator, such as Anthropic, OpenAI, or Google.',
          'DraftMind does not use workspace content to train third-party models or its own models. AI provider API keys are encrypted at rest and are used only to perform requests on behalf of your workspace.',
        ],
      },
      {
        title: 'Cookies and Local Storage',
        body: [
          'DraftMind uses functional cookies and browser storage for authentication, Remember Me preferences, and workspace UI state. We do not use advertising, retargeting, or cross-site tracking cookies.',
        ],
      },
      {
        title: 'Sharing and Subprocessors',
        body: [
          'We share information only as needed to operate DraftMind. Current subprocessors may include Supabase for database, authentication, and storage; Cloudflare for DNS, proxying, and email routing; infrastructure providers for hosting; and the AI provider selected by your workspace.',
        ],
      },
      {
        title: 'Security and Retention',
        body: [
          'We use TLS in transit, Row Level Security, scoped service keys, audit logging, encrypted backups, and encryption for stored AI provider keys. Account and workspace data are retained while the account or workspace is active. After account deletion, data is hard-deleted within 30 days, while encrypted backups may persist for up to 7 additional days.',
        ],
      },
      {
        title: 'Your Rights',
        body: [
          'Subject to applicable law, you may request access, correction, export, deletion, or restriction of personal data. Workspace members should contact their workspace administrator first. Privacy requests can also be sent to privacy@draftmind.web.id.',
        ],
      },
      {
        title: 'Children, Changes, and Contact',
        body: [
          'DraftMind is intended for users aged 13 and older. We may update this policy as the service evolves. Material changes will be announced through the service or by email to workspace administrators. For privacy requests, contact privacy@draftmind.web.id. For general support, contact support@draftmind.web.id.',
        ],
      },
    ],
    footerNote:
      'This policy is written for DraftMind users and workspace administrators. If a workspace has its own internal policy, contact that workspace administrator for organization-specific handling.',
  },
  id: {
    eyebrow: 'Legal / Privasi',
    title: 'Kebijakan Privasi',
    effectiveLabel: 'Berlaku sejak',
    effectiveDate: '23 Mei 2026',
    summary: [
      'DraftMind adalah workspace berbantuan AI untuk membuat Product Requirement Document bagi tim produk. Kebijakan Privasi ini menjelaskan data apa yang kami kumpulkan, bagaimana data digunakan, dan bagaimana Anda dapat meminta pengelolaan data tersebut.',
      'Workspace DraftMind dikelola oleh administrator workspace. Akun dibuat dan dikelola oleh administrator, bukan melalui pendaftaran publik mandiri.',
      'Kami tidak menjual data pribadi. Data digunakan hanya untuk menjalankan, mengamankan, mendukung, dan meningkatkan DraftMind.',
    ],
    sections: [
      {
        title: 'Informasi yang Kami Kumpulkan',
        body: [
          'Kami mengumpulkan informasi yang diperlukan untuk menjalankan DraftMind dan menjaga keamanan workspace.',
        ],
        bullets: [
          'Data akun: nama, alamat email, foto profil, role, dan keanggotaan workspace.',
          'Data autentikasi: token sesi, aktivitas login, status perubahan password, dan log keamanan dari penyedia autentikasi.',
          'Konten workspace: PRD, template, komentar, lampiran, draft yang dibuat AI, dan share link.',
          'Data operasional: alamat IP, tipe browser, timestamp, error event, dan audit log.',
          'Konfigurasi provider: pengaturan AI provider dan API key terenkripsi yang dikonfigurasi oleh administrator workspace.',
        ],
      },
      {
        title: 'Bagaimana Kami Menggunakan Informasi',
        body: [
          'Kami menggunakan informasi untuk menyediakan layanan dan melindungi data workspace.',
        ],
        bullets: [
          'Mengautentikasi pengguna dan mengelola hak akses.',
          'Membuat, mengedit, meninjau, membagikan, dan mengekspor konten PRD.',
          'Menjalankan fitur AI generation dan review menggunakan provider yang dipilih workspace.',
          'Mendeteksi penyalahgunaan, menyelidiki insiden keamanan, dan menjaga audit trail.',
          'Mengirim pemberitahuan operasional seperti reset password, insiden, atau pembaruan penting layanan.',
        ],
      },
      {
        title: 'Pemrosesan oleh AI Provider',
        body: [
          'Saat Anda menggunakan fitur AI, DraftMind dapat mengirim prompt, konten PRD, dan metadata yang relevan ke AI provider yang dikonfigurasi administrator workspace, misalnya Anthropic, OpenAI, atau Google.',
          'DraftMind tidak menggunakan konten workspace untuk melatih model pihak ketiga maupun model internal. API key AI provider dienkripsi saat disimpan dan hanya digunakan untuk menjalankan permintaan atas nama workspace Anda.',
        ],
      },
      {
        title: 'Cookie dan Local Storage',
        body: [
          'DraftMind menggunakan cookie dan penyimpanan browser yang bersifat fungsional untuk autentikasi, preferensi Remember Me, dan status tampilan workspace. Kami tidak menggunakan cookie iklan, retargeting, atau pelacakan lintas situs.',
        ],
      },
      {
        title: 'Pembagian Data dan Subprosesor',
        body: [
          'Kami membagikan informasi hanya jika diperlukan untuk menjalankan DraftMind. Subprosesor yang dapat digunakan meliputi Supabase untuk database, autentikasi, dan storage; Cloudflare untuk DNS, proxy, dan email routing; penyedia infrastruktur untuk hosting; serta AI provider yang dipilih workspace.',
        ],
      },
      {
        title: 'Keamanan dan Retensi',
        body: [
          'Kami menggunakan TLS saat transmisi, Row Level Security, service key terbatas, audit logging, backup terenkripsi, dan enkripsi untuk API key AI provider. Data akun dan workspace disimpan selama akun atau workspace aktif. Setelah penghapusan akun, data dihapus permanen dalam 30 hari, sementara backup terenkripsi dapat bertahan hingga 7 hari tambahan.',
        ],
      },
      {
        title: 'Hak Anda',
        body: [
          'Sesuai hukum yang berlaku, Anda dapat meminta akses, koreksi, ekspor, penghapusan, atau pembatasan pemrosesan data pribadi. Anggota workspace sebaiknya menghubungi administrator workspace terlebih dahulu. Permintaan privasi juga dapat dikirim ke privacy@draftmind.web.id.',
        ],
      },
      {
        title: 'Anak-anak, Perubahan, dan Kontak',
        body: [
          'DraftMind ditujukan untuk pengguna berusia 13 tahun ke atas. Kami dapat memperbarui kebijakan ini seiring perkembangan layanan. Perubahan material akan diumumkan melalui layanan atau email kepada administrator workspace. Untuk permintaan privasi, hubungi privacy@draftmind.web.id. Untuk dukungan umum, hubungi support@draftmind.web.id.',
        ],
      },
    ],
    footerNote:
      'Kebijakan ini ditulis untuk pengguna dan administrator workspace DraftMind. Jika workspace memiliki kebijakan internal sendiri, hubungi administrator workspace tersebut untuk penanganan khusus organisasi.',
  },
} as const;
