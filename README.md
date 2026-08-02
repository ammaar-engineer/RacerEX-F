# RacerEX-F
Small framework with expressjs library to make setup ExpressJS more fast
___
___
# Design penggunaan framework
Framework nya akan di design khusus digunakan untuk mempercepat setup expressjs dan fleksibilitas saat development namun tidak kehilangan kemudahan nya. Saat proses design kita akan mengambil beberapa inspirasi design framework NestJS untuk melihat kira-kira apa saja sih yang dibutuhkan oleh backend development.

Misal middleware nya, sistem validasi nya, service nya, design depedency nya dan lain-lain. Kita juga akan menggunakan modul-modul express lama yang masih bisa dipakai pada repo yang menggunakan ExpressJS

## Komponen framework yang wajib ada
- **Middleware**
- **Controller**
- **Route**
- **Service**
- **Validation**

## Sturktur framework
```md
# Design v1
RacerEX-F/
├── node_modules/
├── src/
│   ├── connection/
│   ├── docs/
│   ├── middlewares/
│   ├── modules/
│   ├── routes/
│   │   ├── controller/
│   │   └── services/
│   ├── validations/
│   └── main.ts
└── .env
```

## Struktur project ketika menggunakan framework RacerEX-F
```md
# Structure design backend RacerFS

src/
├── modules/
│ └── file/
│ ├── controllers/
└── docs/
│ ├── services/
│ ├── validations/
│ ├── dto/
│ └── middlewares/
├── services/
├── middleware/
├── connections/
├── utilities/
└── entities/
```

## Dev story
```typescript
const UserController = new RacerEX_F.Route()
.inject(userService, tokenValidation)
.guards(isValidHuman)

UserController.CreateEndpoint()
.config({
    type: 'REST',
    method: 'post',
    url: 'register'
})
.guards(
    GetUserBodyDTO
)
.middleware(
    loggerRegister
)
.main(async (rcf, injectedModule) => {
    const token = await rcf.getRequest<GetUserBodyDTO>().email
// Some business logic
})

UserController.CreateEndpoint()
.config({
    type: 'ws',
    url: 'chat'
})
.guards( // walau guards nya ada tapi dia bakal diskip
    GetUserBodyDTO
)
.middleware( // ini bakal tetep kena
    loggerRegister
)
.main(async (rcf, injectedModule) => {
    const token = await rcf.getRequest<GetUserBodyDTO>().email
    // Some business logic
})
```
___
# Detail komponen saat ngeproject
1. **Middleware**
Biasa nya digunakan untuk melakukan proses tertentu sebelum mencapai proses bisnis nya. Contoh pada NestJS kita memakai **UseGuards** untuk membuat middleware.

2. **Controller**
Tempat dimana tiap endpoint nya berkumpul dan siap menerima request dari client. Disini lah gerbang antara client dengan business logic sistem

3. **Route**
Tempat dimana rute yang memiliki tanggung jawab tertentu berkumpul.

4. **Service**
Tempat dimana semua logic business nya berada

5. **Validations**
Tempat dimana semua logic validasi berada untuk memvalidasi data yang telah ditentukan