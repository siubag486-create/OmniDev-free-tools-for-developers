export type Stage = {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  sections: Section[];
  defaultCode: string;
  language: string;
};

type SectionItem = {
  label: string;
  description: string;
  note?: string;
};

export type Section = {
  heading: string;
  body?: string;
  codeComment?: string;
  items?: SectionItem[];
  numbered?: boolean;
};

export const stagesData: Stage[] = [
  {
    id: 1,
    title: "웹의 세계관",
    subtitle: "브라우저 · 서버 · IP · 터미널",
    color: "#00ff88",
    language: "bash",
    defaultCode: `# ─────────────────────────────────────
# 터미널 생존 명령어 5가지
# ─────────────────────────────────────

pwd              # 현재 위치 확인
# → /Users/your-name/Desktop

ls               # 파일 목록 보기
# → Documents  Downloads  Desktop

cd Desktop       # 폴더 이동

mkdir my-first-web   # 새 폴더 생성

touch index.html     # 빈 파일 생성

# ─────────────────────────────────────
# [실습] 첫 프로젝트 폴더 만들기
# ─────────────────────────────────────

ls                   # 현재 위치 확인
mkdir my-first-web   # 프로젝트 폴더 생성
cd my-first-web      # 폴더 진입
touch index.html     # HTML 파일 생성
ls                   # 결과 확인
# → index.html

# Tab 키를 누르면 이름이 자동 완성됩니다

# ─────────────────────────────────────
# 인터넷 동작 원리 (참고)
# ─────────────────────────────────────

# 1. 주소창에 "naver.com" 입력
#    └─▶ DNS 서버에 IP 주소 물어봄
#
# 2. DNS: "naver.com = 125.209.222.141"
#    └─▶ 브라우저가 IP 주소로 연결
#
# 3. 서버에 HTTP 요청 전송
#    GET / HTTP/1.1
#    Host: naver.com
#
# 4. 서버가 HTML 파일로 응답
#    └─▶ 브라우저가 화면에 그림`,
    sections: [
      {
        heading: "인터넷은 어떻게 동작하나요?",
        body: "인터넷은 결국 두 컴퓨터가 대화하는 것입니다. 한 쪽은 요청(Request)하고, 다른 쪽은 응답(Response)합니다. 브라우저는 요청하는 쪽, 서버는 응답하는 쪽입니다.",
      },
      {
        heading: "DNS란 무엇인가요?",
        body: 'DNS는 전화번호부입니다. "naver.com"이라는 이름을 숫자로 된 IP 주소로 바꿔줍니다. IP 주소가 실제 컴퓨터의 집 주소입니다.',
        codeComment: "// naver.com → 125.209.222.141",
      },
      {
        heading: "HTTP와 HTTPS의 차이",
        body: "HTTP는 그냥 편지, HTTPS는 봉인된 편지입니다. HTTPS는 암호화되어 있어 중간에서 누가 훔쳐봐도 내용을 알 수 없습니다. 요즘은 HTTPS가 기본입니다.",
      },
      {
        heading: "클라이언트와 서버",
        body: "클라이언트는 서비스를 이용하는 쪽(브라우저, 앱), 서버는 서비스를 제공하는 쪽(컴퓨터)입니다. 내가 유튜브를 보면 나는 클라이언트, 유튜브 컴퓨터가 서버입니다.",
      },
      {
        heading: "터미널, 왜 굳이 써야 하나요?",
        body: `지금까지 우리는 마우스로 아이콘을 클릭하며 컴퓨터를 사용했습니다. 이걸 GUI(그래픽 인터페이스)라고 합니다. 하지만 개발의 세계에서는 글자로 명령을 내리는 CLI(터미널)가 훨씬 강력합니다.

비유하자면, 마우스 클릭은 '식당 메뉴판에서 고르는 것'이고 터미널은 '주방장에게 직접 레시피를 지시하는 것'입니다.

터미널이 필요한 두 가지 이유

속도와 자동화 — 폴더 100개를 한 번에 만들거나, 수천 개의 파일을 동시에 수정하는 일을 단 한 줄 명령어로 처리할 수 있습니다.

서버 조종 — 우리가 만든 웹사이트를 올릴 클라우드 서버에는 마우스가 없습니다. 오직 터미널로만 대화할 수 있습니다.`,
        codeComment: `// GUI(마우스)  →  메뉴판에서 고르기
// CLI(터미널)  →  주방장에게 직접 지시`,
      },
      {
        heading: "반드시 알아야 할 5가지 생존 명령어",
        body: "이 5가지만 알면 터미널에서 절대 길을 잃지 않습니다.",
        items: [
          { label: "pwd", description: "현재 내가 어느 폴더에 있는지 주소를 보여줍니다.", note: '"나 지금 어디 있어?"' },
          { label: "ls", description: "현재 폴더 안에 있는 파일과 폴더 목록을 보여줍니다.", note: '"여기에 뭐뭐 있어?"' },
          { label: "cd", description: "원하는 폴더로 이동합니다.", note: '"이 방으로 들어갈래"' },
          { label: "mkdir", description: "새 폴더를 만듭니다.", note: '"새 창고 하나 만들어줘"' },
          { label: "touch", description: "내용이 빈 새 파일을 만듭니다.", note: '"빈 종이 한 장 꺼내줘"' },
        ],
        codeComment: "// pwd → ls → cd 폴더명 → mkdir 이름 → touch 파일명",
      },
      {
        heading: "[실습] 10초 만에 개발 폴더 만들기",
        body: "마우스는 잠시 내려놓고, 우측 에디터를 참고하며 순서대로 터미널에 입력해 보세요.",
        numbered: true,
        items: [
          { label: "ls", description: "현재 내가 어느 위치에 있는지 확인합니다." },
          { label: "mkdir my-first-web", description: "첫 웹 프로젝트 폴더를 만듭니다." },
          { label: "cd my-first-web", description: "방금 만든 폴더 안으로 들어갑니다." },
          { label: "touch index.html", description: "웹사이트의 뼈대가 될 HTML 파일을 만듭니다." },
          { label: "ls", description: "파일이 잘 만들어졌는지 확인합니다." },
        ],
        codeComment: "// 꿀팁: 앞 글자 몇 개만 치고 Tab 키를 누르면 이름이 자동 완성됩니다",
      },
      {
        heading: "터미널과 친해지는 한 마디",
        body: `터미널은 틀린 명령어를 입력해도 컴퓨터가 고장 나지 않습니다. 단지 이렇게 대답할 뿐입니다.

"command not found"

겁내지 마세요. 틀리면 다시 입력하면 그만입니다.

앞으로 Vibe Coding을 배우면서 AI에게 "이거 실행하는 터미널 명령어 알려줘"라고 묻는 일이 아주 많아질 것입니다. 그때마다 이 검은 화면이 여러분의 가장 든든한 조력자가 되어줄 것입니다.`,
      },
    ],
  },
  {
    id: 2,
    title: "HTML & CSS",
    subtitle: "마크업과 스타일링",
    color: "#58a6ff",
    language: "html",
    defaultCode: `<!-- HTML: 구조 (가구 배치) -->
<!DOCTYPE html>
<html>
  <head>
    <title>내 첫 웹페이지</title>
  </head>
  <body>

    <!-- 제목 태그 -->
    <h1>안녕하세요!</h1>

    <!-- 단락 태그 -->
    <p>저는 CodeBridge로 배우고 있어요.</p>

    <!-- 버튼 태그 -->
    <button>클릭하세요</button>

  </body>
</html>

/* CSS: 스타일 (인테리어) */
h1 {
  color: #00ff88;
  font-size: 2rem;
}

button {
  background: #0a0e1a;
  color: white;
  border: 1px solid #00ff88;
  padding: 10px 20px;
}`,
    sections: [
      {
        heading: "HTML이란?",
        body: "HTML은 웹페이지의 뼈대입니다. 가구를 방에 배치하는 것처럼, HTML 태그로 제목·본문·버튼·이미지를 배치합니다. 브라우저가 HTML을 읽어서 화면에 그립니다.",
      },
      {
        heading: "태그는 가구 라벨",
        body: "`<h1>`은 '이건 제목이에요' 라는 라벨, `<p>`는 '이건 문단이에요' 라는 라벨입니다. 브라우저는 라벨을 보고 어떻게 표시할지 결정합니다.",
        codeComment: "// <tag>내용</tag> — 여는 태그와 닫는 태그",
      },
      {
        heading: "CSS는 인테리어",
        body: "HTML로 배치한 가구에 색을 칠하고, 크기를 조절하고, 간격을 맞추는 것이 CSS입니다. HTML이 구조라면 CSS는 스타일입니다.",
      },
      {
        heading: "선택자(Selector)란?",
        body: "CSS에서 '어떤 요소를 꾸밀지' 고르는 것이 선택자입니다. `h1 { color: red }` 는 모든 h1 태그의 색을 빨간색으로 만듭니다.",
      },
    ],
  },
  {
    id: 3,
    title: "Git & 버전관리",
    subtitle: "코드 히스토리 관리",
    color: "#ffa657",
    language: "bash",
    defaultCode: `# Git 기본 명령어 — 게임 세이브 포인트

# 저장소 초기화 (게임 시작)
git init

# 변경사항 추가 (세이브 준비)
git add .

# 커밋 생성 (세이브 포인트 저장)
git commit -m "로그인 기능 추가"

# 히스토리 보기 (세이브 목록)
git log --oneline

# 브랜치 만들기 (평행 우주 생성)
git branch feature/signup

# 브랜치 이동
git checkout feature/signup

# GitHub에 올리기 (클라우드에 백업)
git push origin main`,
    sections: [
      {
        heading: "Git이란?",
        body: "Git은 코드의 변경 이력을 관리하는 도구입니다. 언제든 과거 상태로 돌아갈 수 있고, 여러 명이 동시에 작업할 수 있습니다.",
      },
      {
        heading: "커밋 = 게임 세이브 포인트",
        body: "커밋(commit)은 현재 상태를 저장하는 것입니다. '보스 전 세이브'처럼, 작업 단위마다 커밋하면 언제든 그 시점으로 돌아올 수 있습니다.",
        codeComment: `// git commit -m "저장 메시지"`,
      },
      {
        heading: "브랜치 = 평행 우주",
        body: "브랜치(branch)는 원본 코드를 건드리지 않고 새 기능을 만드는 공간입니다. 실험이 성공하면 원본에 합치고(merge), 실패하면 그냥 버립니다.",
      },
      {
        heading: "GitHub = 클라우드 백업",
        body: "GitHub는 Git 저장소를 온라인에 올려두는 서비스입니다. 컴퓨터가 고장나도 코드가 안전하고, 다른 사람과 협업할 수 있습니다.",
      },
    ],
  },
  {
    id: 4,
    title: "Vibe Coding",
    subtitle: "AI 에디터로 코딩하기",
    color: "#e3b341",
    language: "markdown",
    defaultCode: `# Cursor AI에게 좋은 프롬프트 쓰는 법

## 나쁜 프롬프트 ❌
"버튼 만들어줘"

## 좋은 프롬프트 ✅
"
초록색 배경의 로그인 버튼을 만들어줘.
- 텍스트: '로그인'
- 크기: 넓이 200px, 높이 48px
- 클릭하면 /login 페이지로 이동
- 호버 시 배경이 어두워지는 효과
"

## Vibe Coding 원칙
1. 결과물을 구체적으로 설명한다
2. 조건과 제약을 명시한다
3. 한 번에 하나씩 요청한다
4. AI 출력을 항상 검토한다`,
    sections: [
      {
        heading: "Vibe Coding이란?",
        body: "AI에게 원하는 것을 자연어로 설명하고, AI가 코드를 작성하는 방식입니다. 개발자는 방향을 잡고 검토하며, AI가 실제 코드를 씁니다.",
      },
      {
        heading: "Cursor 에디터",
        body: "Cursor는 AI가 내장된 코드 에디터입니다. VS Code처럼 생겼지만, AI에게 직접 코드 작성을 요청할 수 있습니다. Ctrl+K로 AI 명령창을 엽니다.",
        codeComment: "// Ctrl+K → AI 프롬프트 입력",
      },
      {
        heading: "좋은 프롬프트 작성법",
        body: "구체적일수록 좋습니다. '버튼 만들어줘'보다 '초록색 200px 버튼, 클릭 시 /login으로 이동, 호버 시 어두워짐'이 훨씬 좋은 결과를 냅니다.",
      },
      {
        heading: "AI 출력 검토하기",
        body: "AI가 쓴 코드는 항상 검토해야 합니다. 원하는 것을 제대로 만들었는지 확인하고, 필요하면 수정을 요청합니다. AI는 도구이지 완벽하지 않습니다.",
      },
    ],
  },
  {
    id: 5,
    title: "JavaScript",
    subtitle: "동작하는 웹 만들기",
    color: "#d2a8ff",
    language: "javascript",
    defaultCode: `// JavaScript 핵심 개념

// 변수 = 포스트잇
let 이름 = "홍길동";
const 나이 = 25;  // 바꿀 수 없는 값

// 함수 = 믹서기 (넣으면 결과가 나옴)
function 인사하기(name) {
  return \`안녕하세요, \${name}님!\`;
}

console.log(인사하기(이름));
// → "안녕하세요, 홍길동님!"

// 조건문 = 신호등
if (나이 >= 19) {
  console.log("성인입니다");
} else {
  console.log("미성년자입니다");
}

// 버튼 클릭 이벤트
document.querySelector("button")
  .addEventListener("click", () => {
    alert("클릭했습니다!");
  });`,
    sections: [
      {
        heading: "JavaScript란?",
        body: "JavaScript는 웹페이지를 '살아있게' 만드는 언어입니다. HTML이 뼈대, CSS가 옷이라면, JavaScript는 웹페이지가 움직이고 반응하게 만드는 근육입니다.",
      },
      {
        heading: "변수 = 포스트잇",
        body: "변수는 정보를 담아두는 포스트잇입니다. `let 이름 = '홍길동'`은 '이름'이라는 포스트잇에 '홍길동'이라고 적는 것입니다. 나중에 다시 쓸 수 있습니다.",
        codeComment: "// let은 바꿀 수 있음, const는 고정",
      },
      {
        heading: "함수 = 믹서기",
        body: "함수는 재료(인자)를 넣으면 결과가 나오는 믹서기입니다. 같은 작업을 여러 번 반복할 때 함수로 만들어두면 코드를 다시 쓸 필요 없이 호출만 합니다.",
      },
      {
        heading: "이벤트 = 트리거",
        body: "이벤트는 사용자의 행동(클릭, 입력, 스크롤)을 감지하는 것입니다. addEventListener로 '이 버튼이 클릭되면 이걸 해'라고 브라우저에게 알려줍니다.",
      },
    ],
  },
  {
    id: 6,
    title: "배포",
    subtitle: "세상에 공개하기",
    color: "#ff7b72",
    language: "bash",
    defaultCode: `# Vercel로 배포하기 — 3단계

# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프로젝트 폴더에서 배포
cd my-project
vercel

# 3. 완료! URL이 나타납니다
# ✅ Deployed to: https://my-project.vercel.app

# ─────────────────────────────
# GitHub 연동 시 자동 배포
# push 하면 자동으로 새 버전이 배포됩니다

git add .
git commit -m "홈페이지 업데이트"
git push origin main
# → Vercel이 자동으로 감지하고 배포

# 커스텀 도메인 연결도 가능!
# example.com → my-project.vercel.app`,
    sections: [
      {
        heading: "배포(Deploy)란?",
        body: "내 컴퓨터에서만 보이던 웹사이트를 인터넷에 올려서 전 세계 누구나 볼 수 있게 하는 것입니다. URL이 생기고 링크를 공유할 수 있습니다.",
      },
      {
        heading: "Vercel이란?",
        body: "Vercel은 무료로 웹사이트를 배포할 수 있는 서비스입니다. GitHub에 코드를 올리면 자동으로 배포해줍니다. next.js 같은 현대적인 프레임워크와 찰떡궁합입니다.",
        codeComment: "// push → 자동 배포",
      },
      {
        heading: "Netlify도 있습니다",
        body: "Netlify도 Vercel과 비슷한 무료 배포 서비스입니다. 정적 사이트 배포에 특화되어 있고, 폼 처리, A/B 테스트 같은 기능도 제공합니다.",
      },
      {
        heading: "CI/CD란?",
        body: "CI/CD는 코드를 push할 때마다 자동으로 테스트하고 배포하는 파이프라인입니다. 개발자가 직접 배포 버튼을 누르지 않아도 됩니다.",
      },
    ],
  },
];

export function getStage(id: number): Stage | undefined {
  return stagesData.find((s) => s.id === id);
}
