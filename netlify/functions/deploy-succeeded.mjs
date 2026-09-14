// Netlify 이벤트 함수: 프로덕션 배포가 성공할 때마다 실행된다.
// 커버 기간(.cover-date)이 지난번 발송 때와 달라졌으면 카카오톡 "나와의 채팅"으로 링크 카드를 보낸다.
//
// 필요한 환경변수 (Netlify UI 또는 `netlify env:set`): KAKAO_REST_KEY, KAKAO_CLIENT_SECRET
// 상태 저장 (Netlify Blobs, store "kakao"):
//   refresh_token  — 카카오 refresh token. 갱신되면 자동으로 덮어쓴다. 최초값은 scripts/kakao-auth.js가 넣는다.
//   last_sent      — 마지막으로 발송한 커버 기간 문자열 (중복 발송 방지)
import { getStore } from '@netlify/blobs';

const SITE = 'https://realestate-weekly-top10.netlify.app/';

export default async (req) => {
  const { payload = {} } = await req.json().catch(() => ({}));
  if (payload.context && payload.context !== 'production') {
    return log(`skip: context=${payload.context}`);
  }

  // 방금 배포된 버전의 HTML을 직접 읽는다 (CDN 캐시와 무관하게 이번 배포 내용 확정)
  const pageUrl = payload.deploy_ssl_url || SITE;
  const html = await (await fetch(pageUrl)).text();
  const info = parsePage(html);
  if (!info.coverDate) return log(`skip: .cover-date not found at ${pageUrl}`);

  const store = getStore('kakao');
  const lastSent = await store.get('last_sent');
  if (lastSent === info.coverDate) return log(`skip: already sent for ${info.coverDate}`);

  const accessToken = await refreshAccessToken(store);
  await sendMemo(accessToken, info);
  await store.set('last_sent', info.coverDate);
  return log(`sent: ${info.coverDate}`);
};

function parsePage(html) {
  const meta = (p) => html.match(new RegExp(`<meta property="og:${p}" content="([^"]*)"`))?.[1];
  const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return {
    coverDate: html.match(/class="cover-date">([^<]+)</)?.[1].trim(),
    title: decode(meta('title')) || '부동산 주간뉴스 TOP 10',
    description: decode(meta('description')) || '',
    image: meta('image') || SITE + 'og-image.png',
    imageWidth: Number(meta('image:width')) || undefined,
    imageHeight: Number(meta('image:height')) || undefined,
  };
}

async function refreshAccessToken(store) {
  const refreshToken = await store.get('refresh_token');
  if (!refreshToken) throw new Error('refresh_token 없음 — scripts/kakao-auth.js로 재인증 필요');

  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KAKAO_REST_KEY,
      client_secret: process.env.KAKAO_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`token refresh 실패 ${res.status}: ${JSON.stringify(data)} — 재인증 필요`);

  // 카카오는 refresh token 만료가 1개월 미만 남았을 때만 새 refresh token을 준다
  if (data.refresh_token) await store.set('refresh_token', data.refresh_token);
  return data.access_token;
}

async function sendMemo(accessToken, info) {
  const link = { web_url: SITE, mobile_web_url: SITE };
  const template = {
    object_type: 'feed',
    content: {
      title: info.title,
      description: info.description,
      image_url: info.image,
      image_width: info.imageWidth,
      image_height: info.imageHeight,
      link,
    },
    buttons: [{ title: '이번 주 TOP 10 보기', link }],
  };
  const res = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: new URLSearchParams({ template_object: JSON.stringify(template) }),
  });
  if (!res.ok) throw new Error(`memo send 실패 ${res.status}: ${await res.text()}`);
}

function log(msg) {
  console.log(`[kakao-notify] ${msg}`);
  return new Response(msg);
}
