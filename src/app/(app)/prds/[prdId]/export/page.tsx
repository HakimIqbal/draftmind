import { redirect } from 'next/navigation';

export default async function ExportPage({ params }: { params: Promise<{ prdId: string }> }) {
  const { prdId } = await params;
  // Export is handled as a modal within the editor, not a standalone page
  redirect(`/prds/${prdId}`);
}
