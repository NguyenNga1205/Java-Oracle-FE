# UniVerse – QLSV Oracle (UI v3)

Giao diện tối, thân thiện, xây trên Next.js 16 + Tailwind v4 + shadcn/ui.

## Chạy

Yêu cầu Node.js 20.9+, backend Spring Boot tại `http://localhost:8080`.

```powershell
npm install
npm run dev
```

Mở http://localhost:3000. Đổi API bằng `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8080`.

## Cấu trúc

- `app/login` – đăng nhập; `app/(app)/*` – các trang sau đăng nhập (dashboard, `[entity]` CRUD (thêm sinh viên có tab Excel), accounts, schedules, teaching-classes, profile).
- `components/ui` – shadcn + component tuỳ biến thay thế control mặc định của trình duyệt:
  `select.tsx` (Select/Combobox), `date-picker.tsx`, `time-picker.tsx`, `dropzone.tsx`.
- `components/app` – shell, DataTable, form, các khối dùng chung.
- `lib/entities.ts` – cấu hình các danh mục CRUD; `lib/api.ts` – gọi API (Basic Auth lưu sessionStorage).

## Theme

Token màu/font nằm trong `app/globals.css` (nền `#0e1116`, accent periwinkle `#93a5ff`), font Be Vietnam Pro + JetBrains Mono.

## Lưu ý

Basic Auth trong sessionStorage chỉ phù hợp demo/local; triển khai thật nên dùng cookie HttpOnly + HTTPS.
