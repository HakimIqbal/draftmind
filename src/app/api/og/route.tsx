import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#16130F',
        color: '#F2EFE8',
        fontFamily: 'Georgia',
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 'bold' }}>DraftMind</div>
      <div style={{ fontSize: 20, color: '#B8B2A6', marginTop: 8 }}>Think Less. Draft Smarter.</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
