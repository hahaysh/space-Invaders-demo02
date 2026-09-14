# 우주 방어

좌우로 이동하며 적 편대를 제거하고 방어선을 지키는 데스크톱 브라우저 게임입니다.
HTML/CSS·ES Modules·Canvas 2D로 구현했으며 외부 이미지나 CDN 없이 실행합니다.

**공개 URL: <https://hahaysh.github.io/space-Invaders-demo02/>**
2026-09-14 첫 공개의 응답·자산·자동 브라우저 조작을 확인했습니다. 사람의 직접 플레이와 UI 승인은 미확인이며, [실제 공개 근거](https://github.com/hahaysh/space-Invaders-demo02/issues/4#issuecomment-5659428787)와 [결과 요약](TEST_RESULTS.md)을 구분해 기록합니다.

## 준비와 설치

검증 환경은 Windows, Node.js `v24.14.1` LTS, npm `10.8.3`, Playwright Chromium입니다.
다른 OS/브라우저와 사람의 직접 플레이는 아직 확인하지 않았습니다.

저장소를 내려받은 후 `package.json`이 있는 폴더에서 실행합니다.

```powershell
npm ci --no-fund --no-audit --registry=https://registry.npmjs.org
```

고정된 의존성은 `package-lock.json`으로 설치합니다. 일반 게임 실행에는 Playwright 브라우저 설치가 필요하지 않습니다.
브라우저 검사를 처음 실행하는 환경에서 Chromium이 없다는 오류가 나오면 다음 명령으로 설치합니다.

```powershell
npm run browser:install
```

현재 검증 환경에는 Chromium이 있어 위 설치 명령을 별도로 실행하지 않았습니다.

## 로컬 실행

```powershell
npm run dev
```

브라우저에서 <http://127.0.0.1:5173/>를 엽니다. 서버는 명령을 실행한 터미널에서 유지되며 `Ctrl+C`로 종료합니다.
이미 같은 게임 서버가 실행 중이면 재사용하고 중복 실행하지 마세요.
포트가 사용 중이면 다른 포트로 자동 변경하지 않고 실패합니다. 소유한 서버인지 확인한 뒤 그 서버만 종료하고, 모르는 프로세스는 종료하지 마세요.

## 조작과 목표

| 동작 | 조작 |
|---|---|
| 게임 시작 | 시작 버튼 또는 Enter |
| 좌우 이동 | ← / → 또는 A / D |
| 연속 발사 | Space 길게 누르기 |
| 승리·패배 후 새 게임 | 다시 시작 버튼 또는 R |

반대 방향을 함께 누르면 정지합니다. 적을 맞히면 제거되고 점수가 올라갑니다.
모든 적을 제거하면 승리하고, 적이 점선 방어선에 닿으면 패배합니다.
종료 후 게임 진행은 멈추며 새 게임은 점수·편대·플레이어·탄환·시간·입력을 초기화합니다.
진행 중 Enter/R은 게임을 초기화하지 않습니다.

포커스를 잃거나 페이지가 비표시되면 누른 키를 비웁니다. 자동 일시정지는 하지 않습니다.
일시정지·난이도 선택·목숨·적 공격·모바일 터치 조작·사운드는 현재 범위에 없습니다.
정확한 수치와 판정 우선순위는 [PRD](PRD.md)를 참조하세요.

## 검사

모델 규칙 검사는 서버 없이 실행할 수 있습니다.

```powershell
npm test
```

실제 Chromium 입력·DOM·Canvas 검사는 **이 저장소의 dev 서버가 위 주소에서 실행 중인 상태**로 별도 터미널에서 실행합니다.
이 검사는 이미 실행 중인 서버를 대상으로 하므로 다른 프로젝트의 서버가 아닌지 먼저 확인하세요.

```powershell
npm run test:e2e
```

Node 검사는 경계·충돌·승패 우선순위·시간·초기화를 확인합니다.
Chromium 검사는 버튼·키보드 입력으로 시작·이동·발사·자연 승패·정지·재시작을 확인합니다.
시간 제어에는 Playwright clock을 사용하고, 일부 입력 정리/반복키 검사는 합성 이벤트를 사용합니다.
자동 검증을 사람의 직접 플레이나 실제 OS 탭 전환 확인으로 간주하지 않습니다.
실제 실행 결과와 미확인은 [구현 계획의 단계별 기록](IMPLEMENTATION_PLAN.md)에 있습니다.

## 빌드와 로컬 배포본 확인

```powershell
npm run build
npm run preview
```

빌드 결과는 `dist`에 생성됩니다. preview 주소는 <http://127.0.0.1:4173/>이며 사용 후 해당 터미널에서 `Ctrl+C`로 종료합니다.
preview는 로컬 빌드 확인용이며 공개 배포가 아닙니다. `dist`, `node_modules`, 테스트 생성물은 Git에 넣지 않습니다.

## GitHub Copilot App 수동 명령

[`.github/github-app.yml`](.github/github-app.yml)은 다음 두 수동 명령만 정의합니다.

| 이름 | 명령 | 범위 |
|---|---|---|
| Run | `npm run dev` | 로컬 개발 서버 |
| Test | `npm test` | Node 모델 검사만 실행 |

자동 설치·삭제·세션 트리거는 없습니다. 의존성 설치와 Chromium 검사는 위 명령을 별도로 실행합니다.
Run을 실행하기 전에 같은 서버가 이미 있는지 확인하세요.

App이 현재 파일의 설정 검토 화면을 제공하면 명령을 읽고 review/accept한 후 사용해야 합니다.
파일이 외부에서 바뀌면 공백·주석 변경만 있어도 다시 검토해야 하며, 그 전에는 이전 설정을 사용할 수 있습니다.
명령은 App의 GitHub 자격 증명을 상속할 수 있으므로 환경 변수·토큰을 출력하거나 저장하도록 변경하지 마세요.

**현재 설정 trust review/accept와 App Run UI 동작은 미확인입니다.**
이 환경에서 App UI 조회가 도구에 의해 거부되어 우회하지 않았습니다. 터미널에서 같은 명령이 성공한 사실과 App 적용 여부는 구분합니다.
설정 형식과 신뢰 절차는 [공식 문서](https://docs.github.com/copilot/reference/github-copilot-app-reference/repository-configuration)를 따릅니다.

## 문서

- [ideation.md](ideation.md): 대상과 재미
- [PRD.md](PRD.md): 제품 수치·규칙·수용 기준
- [TRD.md](TRD.md): 기술 선택과 검증 책임
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md): 단계별 진행·실제 결과·남은 작업
