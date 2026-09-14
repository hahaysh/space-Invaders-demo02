# 우주 방어 구현 계획

## 기준 및 계획 검토

- 제품 기준은 `PRD.md`, 기술 결정은 `TRD.md`, 대상과 재미는 `ideation.md`를 따른다. 수치와 규칙을 이 문서에 복제하지 않는다.
- 2026-09-14 준비 확인: 격리 worktree의 HEAD, origin/main, 공통 조상 및 원격 main은 모두 `1de6e84915cfa8cf7cac4437ee1a280ce8996236`이었다. 네 설계 문서를 main에서 전문 읽었고 이슈 #2 본문과 댓글(없음)을 확인했다.
- 초기 브랜치 `hahaysh-issue-2-0b2b7e`를 파일 생성 전에 App 도구로 `hahaysh-space-defense-basic-game`으로 변경했다.
- 고정 안내서 `hahaysh/space-Invaders@3637e1ad7897a2e674aa85cb8f3f6154da4b3907`의 `docs/04-01-첫-게임-구현.md`를 GitHub API로 직접 전문 읽었다. 원본 안내서나 샘플을 복사하지 않는다.
- M1을 먼저 검토하고 이 파일을 코드 및 설치보다 먼저 작성했다. 순서는 순수 모델 → 입력과 렌더링 → Node 및 실제 브라우저 검사 → diff 검토 → 커밋·feature push·이슈 기록이다.
- 사용자 위임 승인에 따른 자동 실행이다. 사람이 App Plan/Interactive UI를 직접 승인·전환했다거나 App 지침이 자동 적용되었다고 주장하지 않는다.

## 마일스톤

| 작업 | 요구사항 | 예상 변경 | 실제 확인 방법 | 상태 |
|---|---|---|---|---|
| M1 / 04-01 | R01~R03, R09의 시작·진행 입력 | manifest/lock, Vite, 순수 모델, HTML/CSS/Canvas UI, Node 및 브라우저 검사 | 시작 버튼·Enter, 실제 키, DOM 및 Canvas 픽셀, 모델 시간·경계, 서버 응답, build | 실제 완료, 아래 실행 기록 참조 |
| M2 / 04-02 | R04~R08 및 종료 입력 | 편대·충돌·점수·승패·재시작과 관련 검사 | 모델 경계·충돌·우선순위·초기화, 실제 브라우저 입력·결과 | 예정, 별도 전달 후 |
| M3 / 04-03 | R10 및 기본 게임 인도 | README, 실제 명령 기반 App 설정, 검증 정리 | 실행·조작 대조, 명령 재실행, PR 리뷰·검사 | 예정, 아직 `.github` 작성 금지 |

M1에는 적·점수·승패·재시작이 없다. 일시정지·난이도·목숨·적 공격·배포도 이번 작업에서 제외한다.

## 20단계 진행표

| 순서 | 단계 | 상태 | 근거 |
|---|---|---|---|
| 1 | 01-01 | 완료 | 기존 Initial commit `23f9d7b` 보존 |
| 2 | 01-02 | 완료 | `cae937f` |
| 3 | 02-01 | 완료 | `72fa938` |
| 4 | 02-02 | 완료 | `36d74e2` |
| 5 | 02-03 | 완료 | `e76acf8` |
| 6 | 03-01 | 완료 | 문서 PR #1 병합 `1de6e849`, 이슈 #2 및 현재 격리 새 세션 확인 |
| 7 | 04-01 | 완료 | M1 구현, Node 8/8·Chromium 5/5·build, 실제 결과는 아래 기록 |
| 8 | 04-02 | 예정 | M2, 별도 전달 대기 |
| 9 | 04-03 | 예정 | M3 |
| 10 | 05-01 | 예정 | 미실행 |
| 11 | 05-02 | 예정 | 미실행 |
| 12 | 06-01 | 예정 | 미실행 |
| 13 | 06-02 | 예정 | 미실행 |
| 14 | 06-03 | 예정 | 미실행 |
| 15 | 07-01 | 예정 | 미실행 |
| 16 | 07-02 | 예정 | 미실행 |
| 17 | 08-01 | 예정 | 미실행 |
| 18 | 08-02 | 예정 | 미실행 |
| 19 | 09-01 | 예정 | 미실행 |
| 20 | 09-02 | 예정 | 미실행 |

앞 단계 커밋 근거는 이슈 #2와 coordinator 전달 내용이다. 이 세션에서 앞 단계를 다시 수행한 것은 아니다.

## 04-01 실행 기록

- 2026-09-14 12:25 +09:00: Node `v24.14.1`, npm `10.8.3` 확인.
- `npm view vite version engines --json`은 `8.3.0-beta.0`을 반환했다. 사전판을 제외하고 `npm view vite@8 version engines --json`으로 안정판 `8.2.2`를 선택했다.
- `npm view @playwright/test version engines --json` 및 해당 버전 dependencies 조회로 안정판 `1.63.0`을 확인했다. 두 패키지 모두 현재 Node와 호환된다.
- 위 정확한 버전과 실행 scripts를 manifest에 먼저 정의한 뒤 `npm install --no-fund --no-audit`를 실행했다(18개 패키지, npm 표시 약 1분). Chromium이 이미 실행 가능하여 `npm run browser:install`은 실행하지 않았다.

### 실제 검사 및 검토

검증 환경은 Windows, 위 Node/npm, Playwright Chromium이다. 다음 시간은 2026-09-14 +09:00이며 소요 시간은 각 도구의 출력값이다.

| 시각 | 실제 명령·검사 | 결과 |
|---|---|---|
| 12:27~12:29 | `npm test`, `npm run build`, `npm ls --depth=0` | 최초 Node 7/7, build 571ms, manifest와 설치 버전 일치 |
| 12:29 | `npm run test:e2e` | Chromium 5/5, 28.3초 |
| 12:30 | `npm test && npm run test:e2e && npm run build` | 불규칙 프레임 간격 검사를 추가하고 발사 시각에서 하위 갱신을 나누도록 보강한 뒤 Node 8/8, 249ms; Chromium 5/5, 14.3초; build 143ms |
| 12:31 | 위 세 명령 재실행 | favicon 보완 뒤 Node 8/8, 178ms; Chromium 5/5, 13.6초; build 136ms |
| 12:32 | 별도 Playwright 브라우저 도구의 실제 버튼 클릭·ArrowRight/Space 입력, DOM 및 Canvas 읽기 | 진행 상태, 이동 후 우주선 픽셀 x=461, 탄환 픽셀 99 확인. 가상 시계 없는 실제 시간 입력. 수정 후 콘솔 오류 0 |
| 12:34 | 공개 npm lockfile로 `npm ci --no-fund --no-audit --registry=https://registry.npmjs.org` | 18개 패키지, 7초. 후속 엄격 검사에서 불필요한 로컬 링크를 발견하여 아래 절차로 제거 |
| 12:34 | `npm test && npm run build`, `npm run test:e2e` | Node 8/8, 185ms; build 859ms; Chromium 5/5, 14.0초 |
| 12:36 | worktree에서 `npm install --package-lock-only --ignore-scripts --no-fund --no-audit --registry=https://registry.npmjs.org` | manifest 기준 lockfile 정규화, 로컬 링크 제거. 공개 registry URL 및 인증정보 부재, manifest/lock 일치 검사 통과 |
| 12:36 | `npm ci --no-fund --no-audit --registry=https://registry.npmjs.org && npm test && npm run build` | 최종 clean install 18개, 3초; Node 8/8, 173ms; build 417ms |
| 12:37 | `npm run test:e2e` | 최종 Chromium 5/5, 12.6초 |
| 12:32~12:37 | application/test 전체 staged diff 및 `git diff --cached --check` 검토 | 기존 네 문서 변경 없음, 생성물 제외, M2 기능·전역 모델·치트 없음. 빌드 HTML의 자산·favicon 경로가 상대 경로임을 확인 |

Node 검사는 PRD의 초기 상태·좌표·속도·양쪽 경계·반대 입력·탄환 출발/간격/제거·불규칙 시간 분할을 확인한다.
Chromium 검사는 실제 버튼·키보드 입력 및 DOM/Canvas 픽셀로 시작·이동·반대 입력·경계·연속 발사·키 해제·스크롤 방지를 확인한다.
시간 제어가 필요한 E2E는 Playwright clock을 사용하며 앱 모델을 읽거나 쓰지 않는다.
blur 및 비표시 처리는 브라우저 이벤트를 합성하고 `document.hidden`을 테스트 안에서만 일시 대체하여 검증했다.
반복 Enter와 defaultPrevented의 세부 분기는 합성 KeyboardEvent로도 검사했다. 이 부분을 실제 OS 포커스·탭 전환이나 사람 입력 검증으로 간주하지 않는다.
별도 도구에서 title/playing 스크린샷을 캡처하고 진행 화면의 우주선·탄환·한국어 안내를 확인했다. 이미지는 세션 아티팩트로 보존하며 저장소에 넣지 않는다.

### 발견·실패 및 보완

- 최초 일반 브라우저 탐색에서 `/favicon.ico` HTTP 404 콘솔 오류를 발견했다. 자체 도형 SVG와 명시적 favicon 링크를 추가하고 HTTP 검사 및 브라우저 재탐색으로 해소했다. 테스트 assertion 실패는 발생하지 않았다.
- lockfile 검토에서 환경 기본 패키지 미러 주소를 발견했다. 공개 레지스트리의 동일 고정 버전을 재확인하고, 별도 세션 아티팩트 디렉터리에서 `npm install --package-lock-only --ignore-scripts --no-fund --no-audit --registry=https://registry.npmjs.org --prefix <artifact-dir>`로 새 lockfile을 생성했다. 생성 파일을 적용하고 위 `npm ci` 및 전체 검사를 다시 실행했다. 환경 미러 주소는 커밋하지 않는다.
- 위 `--prefix` 생성은 공개 패키지 주소 외에 작업 디렉터리의 불필요한 자기 참조 file 링크를 추가했다. 최종 엄격 URL 검사에서 실패로 검출했으며, 현재 worktree의 원래 manifest로 `npm install --package-lock-only`를 다시 실행해 제거했다. 최종 lockfile에는 로컬 링크·환경 경로·인증정보가 없고 manifest와 일치한다. 그 뒤 소유 서버를 종료하고 clean install·Node·build·Chromium 검사를 모두 다시 실행했다.
- lockfile 검사 명령의 `ConvertFrom-Json`은 빈 문자열 키 때문에 실패했다. `ConvertFrom-Json -AsHashtable`로 재실행하여 공개 레지스트리의 43개 resolved 항목을 확인했다.
- 스크린샷 도구에서 세션 아티팩트 절대 경로를 직접 지정한 첫 저장 요청은 허용 루트 밖이라는 오류로 실패했다. 도구의 허용 worktree에 상대 경로로 저장한 뒤 세션 아티팩트로 옮겼다.
- 위 도구 오류와 제품 결함을 구분했으며 의도적으로 실패를 만들거나 테스트 수를 맞추지 않았다.

### 서버 및 재실행

- 실행: 이 worktree에서 `npm run dev`; 별도 셸에서 `npm test`, `npm run test:e2e`, `npm run build`.
- E2E는 명시적으로 먼저 시작한 dev 서버가 필요하다. 자동 서버 재사용으로 다른 프로세스의 앱을 검사하지 않도록 이 세션이 서버의 명령행·소유권을 확인했다.
- 최초 서버: shell `m1-dev`, Node PID `16836`, `http://127.0.0.1:5173/`, HTTP 200. lockfile 재설치 전에 해당 소유 shell만 종료했고 기존 PID 종료도 확인했다.
- 중간 서버: shell `m1-dev-final`, Node PID `33984`, HTTP 200 확인 후 최종 lockfile clean install을 위해 소유 shell만 종료했다.
- 최종 서버: shell `m1-dev-verified`, Node PID `17652`, 부모 PID `14424`, 같은 URL/포트, HTTP 200. 해당 worktree의 Vite 명령행과 `--strictPort` 확인. 미리보기를 위해 세션에 연결된 상태로 유지하며 종료가 필요하면 소유 shell만 종료한다. 영구 분리 프로세스가 아니다.

### 인도 범위 및 미확인

- 완료: **[04-01, 7/20]**, M1 title/playing·시작·이동·발사 및 시작/진행 입력 정리.
- 미구현: M2의 적·점수·충돌·승패·재시작, M3의 README/App 설정. `.github`, PR·병합·배포 작업은 하지 않았다.
- 미확인: 사람 직접 플레이·App UI 직접 승인/모드 전환·App 지침 자동 적용, 실제 OS 탭 비표시 전환, 다른 브라우저/OS, preview 명령 실행.
- 다음은 coordinator의 별도 04-02 전달을 기다린다. 현재 기본 게임 이슈 전체를 완료한 것은 아니다.
- 검토 후 한국어 커밋과 정상 feature push만 수행한다. 실제 SHA·원격 결과·이슈 #2 댓글 링크는 원격 실행 후 기록한다.
