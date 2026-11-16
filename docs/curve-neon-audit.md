# Shared curve inventory and runtime audit

Inventory recorded before the shared rollout. Scope: all `src/` SVG, curve,
notch, shape, mask, clip and dash implementations, including CSS decorations.

| Module | File | Curve / purpose | Visible? | Path source | Previous effect | Runner decision |
|---|---|---|---|---|---|---|
| Adscheck Pro | `ads-check-shell-curve.tsx` | A, left shell contour | Yes, desktop | `buildShellPath` runtime substring | Base + low-contrast runner | Yes; improve contrast |
| Adscheck Pro | `ads-check-adaccounts-workspace.tsx` | B, asset-tab workspace contour | Yes | `buildWorkspaceSurfacePath` via `workspaceSurface.path` | Base + runner | Yes; add endpoint fade |
| Ads Save, including `/ads-save` alias | `ads-save-page.tsx`, shared shell | A | Yes, desktop | Same canonical shell path | None (`neon=false`) | Yes |
| Dashboard, Extended Payment, Billing, Notification, Account | `ads-check-product-shell.tsx`, shared shell | A and C, left contour and right indentation | Yes, desktop | Same canonical shell path; C follows `showRightCurve` | None | Yes wherever already visible |
| Adscheck Pro / Ads Save | shared shell | C | Intentionally hidden | Existing showRightCurve flag | None | Keep hidden |
| Billing, all three tabs | `ads-check-billing-workspace-surface.ts`, `ads-check-billing-page.tsx` | D, billing workspace tab contour | `SHOW_CURVE_D=true` | `buildBillingWorkspacePath` | None | Yes |
| Control Hub | `ads-save-modals.tsx`, `ads-check-pro-control-hub-*.tsx` | No separate shell contour | Modal only | Ordinary modal surfaces; surrounding shared shell belongs to host route | None | Host shell gets effect; no invented modal curve |
| Workflow | `ads-check-pro-workflow-panel.tsx`, `ads-check-pro-workflow-step-geometry.ts` | Step-card notch | Yes with steps | `buildStepCardNotchPath` | Card border | No: content card, not decorative shell/workspace contour |

## Curve A runtime before changes

Chrome on `/app/adscheck-pro/adaccounts`, 1536×900, normal motion:

- Mounted, same referenced path as base; unique React-generated path/gradient IDs.
- Actual length: 521.66px; normalized pathLength: 1000.
- Stroke: rgb(230,252,255), width 2.3px, opacity **0.13 per layer**.
- Dash array: `140px, 1000px`; animation `ads-curve-neon-travel`, 3.4s,
  running, reverse. Sample offsets: -865.882, -463.529, -61.1765px.
- No mask or clipPath on runner; ancestor opacity 1. SVG/shell overflow hidden,
  but the interior A contour and moving highlight are visible in phase captures.
- Runner renders after glow/base. Reduced motion is false. No ID collision found.
- Therefore the reported invisibility is **low visual prominence, not a stopped
  animation** in this environment. Before captures at 400/1600/2800ms show movement.
  Also, other shared-shell modules never enabled the effect at all.

Artifacts from runtime checks are in `test-results/neon-audit/` (ignored by git).

## Kết quả triển khai

- Dùng chung `AdsCheckCurveNeon` cho A/B/C/D, với cấu hình màu, độ dày,
  thời lượng, độ trễ và chiều dài runner. Mọi lớp nhận cùng `d` runtime.
- Path animated trực tiếp có `pathLength=100`; pulse dài 12%, 12 lớp lồng nhau,
  màu cyan ở đầu/đuôi và trắng cyan ở lõi. Nét 2.8px, opacity .22 mỗi lớp;
  base giảm xuống .7 để tăng tương phản. Runner luôn vẽ sau base/glow.
- Mask gradient fade 0 → 1 trong 10% đầu, giữ sáng đến 90%, rồi về 0.
  Mask phủ cả base, glow và runner. A/C theo trục dọc; B/D theo trục ngang.
- Tất cả ID effect dùng `useId()`; wash/notch của Pro và wash của Billing cũng
  chuyển sang ID theo instance. Không phát hiện ID SVG trùng trong các route test.
- A: 3.4s / 0s; B: 3.7s / -0.4s; C: 4s / -0.8s; D: 3.9s / -1.2s.
  A đảo chiều animation vì path canonical đi từ dưới lên; ánh sáng đi từ trên xuống.
- Reduced motion tắt pulse và animation; base/glow có fade vẫn hiển thị.
- Không thêm vòng lặp JS, state animation hoặc đo DOM theo frame.
- C giữ nguyên flag và thứ tự lớp của shell: không bật C trong Pro/Ads Save,
  không đưa những đoạn C vốn bị nội dung che lên trên nội dung.

## Bằng chứng Curve A sau sửa

Chrome 1536×900, ảnh runtime tại ba pha (không chỉ kiểm tra CSS):

| Pha | Vị trí pixel sáng nhất trên spine | Red channel | Dashoffset |
|---|---:|---:|---:|
| 0.8s | y=339px | 218/255 | -73.6471px |
| 1.6s | y=476px | 218/255 | -47.2941px |
| 2.4s | y=614px | 218/255 | -20.9412px |

Computed: animation-name `ads-curve-neon-travel`, duration `3.4s`, dasharray
`12px, 100px`, opacity `0.22`, stroke-width `2.8px`, pathLength `100`.
Ảnh `after-800.png`, `after-1600.png`, `after-2400.png` xác nhận lõi trắng
di chuyển xuống và có hai đầu mềm; base/glow mờ dần tại hai đầu contour.

## Kiểm thử

- So sánh path shell trước/sau ở 7 route: khớp nguyên chuỗi; path Billing D
  ở route Billing cũng khớp trước/sau. Không sửa các file geometry canonical.
- Ma trận desktop: 1366, 1536, 1720, 1920, 2560, 3440px cho từng route:
  Pro, Ads Save, Home, Extended Payment, Billing, Notification, Account.
- Test `e2e/ads-check-shared-neon.spec.ts`: path các lớp đồng nhất trong lúc
  resize, offset thay đổi thực, ID duy nhất, reduced motion và lỗi runtime.
- Build PASS; lint PASS (0 lỗi, 8 warning có sẵn ở các file khác).
- Kết quả cuối: 7 test Playwright PASS, bao phủ 42 tổ hợp route/độ rộng.
- Billing kiểm tra thêm cả purchase/plans/history; Control Hub kiểm tra modal
  trên workspace Pro và alias `/ads-save` kiểm tra shell dùng chung.
