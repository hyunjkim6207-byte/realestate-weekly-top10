// 카카오 "나와의 채팅" 자동발송용 refresh token을 (재)등록한다.
// 최초 1회, 또는 netlify/functions/deploy-succeeded.mjs 로그에 "재인증 필요"가 찍혔을 때 실행:
//   1) 브라우저에서 아래 URL 로그인·동의 → 주소창 ?code=XXXX 복사 (몇 분 안에 만료, 1회용)
//   2) npm run kakao:auth -- XXXX
// KAKAO_REST_KEY / KAKAO_CLIENT_SECRET은 Netlify 환경변수에서 읽는다 (netlify CLI 로그인 필요).

const { execFileSync } = require('child_process');

const SITE = 'https://realestate-weekly-top10.netlify.app/';
const netlify = (...args) =>
  execFileSync('netlify', args, { encoding: 'utf8', shell: process.platform === 'win32' }).trim();

async function main() {
  const restKey = netlify('env:get', 'KAKAO_REST_KEY');
  const code = process.argv[2];
  if (!code) {
    console.log('인가 코드가 필요합니다. 아래 URL을 브라우저로 열고, 돌아온 주소의 code= 값을 넘겨주세요:\n');
    console.log(`https://kauth.kakao.com/oauth/authorize?client_id=${restKey}&redirect_uri=${SITE}&response_type=code&scope=talk_message`);
    process.exit(1);
  }

  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: restKey,
      client_secret: netlify('env:get', 'KAKAO_CLIENT_SECRET'),
      redirect_uri: SITE,
      code,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`토큰 발급 실패 ${res.status}: ${JSON.stringify(data)}`);

  netlify('blobs:set', 'kakao', 'refresh_token', data.refresh_token);
  const days = Math.round(data.refresh_token_expires_in / 86400);
  console.log(`refresh token 등록 완료 (scope: ${data.scope}, 만료까지 ${days}일 — 매주 발송 때 자동 갱신됨)`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
