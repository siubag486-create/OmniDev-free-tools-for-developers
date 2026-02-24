현재 코드를 git에 업로드하세요.

다음을 순서대로 수행:
1. `git status`로 변경사항 확인
2. `git diff`로 변경 내용 파악하여 적절한 커밋 메시지 생성
3. 관련 파일만 `git add` (민감 파일 .env, credentials 등 제외)
4. 생성한 커밋 메시지로 `git commit` (Co-Authored-By 포함)
5. `git push origin main`으로 원격 저장소에 업로드
6. 결과 보고

주의:
- 변경사항이 없으면 커밋하지 않고 사용자에게 알림
- 커밋 메시지는 변경사항을 명확하게 요약
- push 전 확인 없이 바로 실행
