# Phase 04 — Explore V8 library

## Completed

- [x] Rebuild the Explore modal around the full 13-group source navigation.
- [x] Add 70 tutorial screens across Super Share, Ads Check Pro, Payment & Billing, Trình quản lý quảng cáo, Kháng TKQC, Đổi Info, Xóa QTV ẩn, and Share Pixel.
- [x] Add the five standalone screens: Tổng quan, Giao diện, Control Hub, Phiên bản VIP, and Tính năng khác.
- [x] Add nested search, accordion expansion, active-state styling, 75-screen progress, video-preview state, and sequential “Xem tiếp” navigation.
- [x] Match the dark green library shell, black content viewport, teal tutorial artwork, gold active state, and desktop/mobile scroll behavior.
- [x] Split data, sidebar, content, and modal state into focused modules under 120 lines each.

## Verification

- [x] `npm run lint`
- [x] `npm run build`
- [x] Desktop visual check at the application viewport.
- [x] Mobile visual check at 390×844.
- [x] Search and open a nested Ads Check Pro tutorial.
- [x] Search and open a nested Share Pixel tutorial.
- [x] Verify “Xem tiếp” advances to the next screen.

## Prototype boundary

Tutorial controls render local preview screens. Known source videos link directly to YouTube; remaining tutorial entries use a YouTube search link until production video IDs are supplied.
