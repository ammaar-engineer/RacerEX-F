# RacerEX-F — Tools

## `init.structure.js`

Script untuk menginisialisasi struktur folder `src/` dan menampilkan file tree di terminal.

**Jalankan:**
```bash
node tool/init.structure.js
```

**Yang dilakukan:**
- Membuat folder-folder wajib di dalam `src/` jika belum ada
- Menampilkan file tree dari seluruh isi `src/` secara rekursif

**Struktur yang diinisialisasi:**
```
src/
├── connection/
├── docs/
├── middleware/
├── modules/
├── types/
└── validations/
```

**Output contoh:**
```
src/
├── connection/
├── docs/
├── middleware/
├── modules/
│   └── app/
│       ├── middleware/
│       │   └── error.middleware.ts
│       └── main.ts
├── types/
│   └── response.output.ts
├── validations/
│   └── function.validation.ts
└── main.ts
```

**Konvensi warna:**
| Warna | Tipe |
|-------|------|
| Biru | Folder |
| Cyan | File `.ts` |
| Kuning | File `.md` |
| Abu-abu | File lainnya |
