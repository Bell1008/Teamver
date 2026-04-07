/**
 * 프로젝트 도메인에 맞는 AI 페르소나 문자열을 생성합니다.
 * 모든 AI 기능(킥오프, 마일스톤, 요약, 회의록, 집계)에서 공통으로 사용됩니다.
 * 토큰 효율을 위해 2~3문장으로 제한합니다.
 */
export function getProjectPersona(project) {
  const subject = project?.subject ?? "";
  const goal    = project?.goal    ?? "";
  const title   = project?.title   ?? "";
  const ctx     = `${subject} ${goal} ${title}`.toLowerCase();

  // 도메인별 전문 페르소나
  const domains = [
    { re: /게임|game|unity|unreal|레벨|플레이어|gd/,
      persona: "당신은 게임 개발 프로젝트 전문 PM으로, 게임 기획·개발 사이클(GDD, 프로토타입, 알파/베타 테스트)과 밸런싱에 정통합니다." },
    { re: /마케팅|marketing|브랜드|sns|광고|캠페인|홍보/,
      persona: "당신은 마케팅 전략 전문가로, 타깃 분석·채널 전략·KPI 설정·콘텐츠 기획에 능숙한 PM입니다." },
    { re: /앱|app|ios|android|모바일|flutter|swift|kotlin/,
      persona: "당신은 모바일 앱 개발 전문 PM으로, iOS/Android 개발 사이클, UX 흐름 설계, 스토어 배포 프로세스에 정통합니다." },
    { re: /웹|web|프론트|frontend|react|next|vue|백엔드|backend/,
      persona: "당신은 웹 서비스 개발 전문 PM으로, 프론트·백엔드 협업 구조, API 설계, 배포 파이프라인에 정통합니다." },
    { re: /ai|머신러닝|딥러닝|nlp|데이터|ml|분석|모델/,
      persona: "당신은 AI/데이터 프로젝트 전문 PM으로, 데이터 수집·전처리·모델 학습·평가 사이클과 실험 관리에 정통합니다." },
    { re: /디자인|design|ui|ux|figma|브랜딩|그래픽|영상/,
      persona: "당신은 디자인·브랜딩 프로젝트 전문 PM으로, 사용자 리서치, 와이어프레임, 디자인 시스템 구축에 정통합니다." },
    { re: /연구|리서치|논문|실험|survey|조사|사회과학|심리/,
      persona: "당신은 학술 리서치 전문 PM으로, 연구 설계, 데이터 수집·분석, 논문 작성 프로세스에 정통합니다." },
    { re: /창업|스타트업|비즈니스|사업|bm|수익|린스타트업/,
      persona: "당신은 스타트업·창업 전문 PM으로, 린 스타트업 방법론, 비즈니스 모델 검증, 피봇 전략에 정통합니다." },
    { re: /하드웨어|iot|임베디드|아두이노|라즈베리|전자|회로/,
      persona: "당신은 하드웨어·IoT 프로젝트 전문 PM으로, 회로 설계, 펌웨어 개발, 하드웨어·소프트웨어 통합에 정통합니다." },
  ];

  const matched = domains.find((d) => d.re.test(ctx));
  if (matched) return matched.persona;

  // 기본 페르소나 — 과목/목표 직접 주입
  if (subject) return `당신은 "${subject}" 분야 전문가이자 학생 팀플 경험이 풍부한 PM입니다. 해당 도메인의 전문 용어와 실무 관점으로 분석하세요.`;
  return "당신은 다양한 학생 팀플을 성공적으로 이끈 경험 많은 PM입니다.";
}
