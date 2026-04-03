# Avana Villas - Arkitektura dhe Plani i Platformës

Ky dokument përshkruan arkitekturën, strukturën e skedarëve dhe detajet e implementimit të platformës së rezervimeve **Avana Villas**.

## 1. Përmbledhje e Projektit

**Avana Villas** është një platformë uebi e krijuar për rezervimin e vilave luksoze. Ajo përmban një frontend modern dhe responsiv për përdoruesit për të eksploruar dhe rezervuar vilat, si dhe një sistem backend të sigurt për menaxhimin e rezervimeve, çmimeve dhe disponueshmërisë.

### Teknologjitë e Përdorura (Stack)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript. Ofron një përvojë të shpejtë, të lehtë dhe statike.
- **Backend**: Node.js me Express.js. Trajton kërkesat API, logjikën e biznesit dhe ndërveprimet me bazën e të dhënave.
- **Baza e të Dhënave**: SQLite (`avana.db`). Një bazë të dhënash e lehtë dhe relacionale për ruajtjen e rezervimeve, çmimeve dhe përdoruesve admin.
- **Shërbimi i Email-it**: Nodemailer (SMTP). Dërgon njoftime automatike me email për rezervimet e reja.
- **Hostimi**: Aktualisht e konfiguruar për zhvillim lokal (`localhost:3000`).

---

## 2. Diagrami i Arkitekturës

```mermaid
graph TD
    User[Përdoruesi (Browser)] -->|HTTP Request| Frontend[Frontend (HTML/CSS/JS)]
    Frontend -->|Thirrje API (fetch)| Backend[Backend (Node.js/Express)]
    Backend -->|Query/Update| DB[(Baza e të Dhënave SQLite)]
    Backend -->|Dërgon Email| SMTP[Shërbimi Email (Nodemailer)]
    Admin[Admin] -->|Login/Menaxhim| AdminPanel[Paneli Admin (/admin)]
    AdminPanel -->|Thirrje API (Auth)| Backend
```

---

## 3. Struktura e Projektit dhe Dosjet

### Direktoria Kryesore (`/`)
Kjo direktori shërben si frontend-i publik i aplikacionit.

- **`index.html`**: Faqja kryesore (Landing Page). Përmban seksionin "Projekti", banerin kryesor dhe navigimin.
- **`villas.html`**: Faqe e detajuar që prezanton vilat e disponueshme (Standard & Premium) me përshkrime dhe komoditete.
- **`bookings.html`**: Ndërfaqja e rezervimit. Përmban formën e rezervimit, zgjedhjen e datave dhe llogaritjen dinamike të çmimit.
- **`gallery.html`**: Një galeri vizuale e vilave dhe natyrës përreth.
- **`admin/`**: Përmban `index.html` për panelin e administrimit (lejon menaxhimin e rezervimeve dhe çmimeve).
- **`assets/`**: Ruan asetet statike si imazhe, ikona dhe logo (p.sh., `Avana Villas.png`).
- **`css/`**: Përmban `style.css` për stilimin global dhe strukturën vizuale.
- **`js/`**: Përmban `main.js` për logjikën e përbashkët të frontend-it (p.sh., navigimi, menuja mobile).
- **`qa/`**: Shënimet e Sigurimit të Cilësisë (`qa_notes.md`).

### Direktoria Backend (`/backend`)
Backend-i është zemra e logjikës së aplikacionit.

- **`server.js`**: Pika hyrëse e aplikacionit.
    - Konfiguron serverin Express.js.
    - Përcakton rrugët e API (`/api/...`).
    - Konfiguron CORS dhe Body Parser.
    - Inicializon Nodemailer për dërgimin e email-eve.
    - Shërben skedarët statikë nga direktoria kryesore.
- **`database.js`**: Moduli i konfigurimit të bazës së të dhënave.
    - Lidhet me `avana.db`.
    - Krijon automatikisht tabelat (`bookings`, `prices`, `admins`, `audit_logs`) nëse nuk ekzistojnë.
    - Mbush të dhënat fillestare (çmimet bazë, përdoruesi admin default).
- **`avana.db`**: Skedari i bazës së të dhënave SQLite që ruan të gjitha të dhënat e aplikacionit.
- **`.env`**: Skedar konfigurimi për variablat e ndjeshme (Kredencialet SMTP, Sekretet e Adminit).
- **`package.json`**: Liston varësitë e backend-it (`express`, `sqlite3`, `nodemailer`, `cors`, `dotenv`).

---

## 4. Veçoritë Kryesore & Rrjedha e Punës

### A. Sistemi i Rezervimit
1.  **Ndërveprimi i Përdoruesit**: Përdoruesi hap `bookings.html`.
2.  **Kontrolli i Disponueshmërisë**: Kur zgjidhet një tip vile, frontend-i kërkon datat e bllokuara (`GET /api/availability`).
3.  **Validimi**: Përdoruesit nuk mund të zgjedhin data që përputhen me rezervimet ekzistuese të konfirmuara.
4.  **Dërgimi**: Të dhënat e formës dërgohen te `POST /api/bookings`.
5.  **Procesimi në Backend**:
    -   Kontrollon sërish për mbivendosje rezervimesh (siguri shtesë).
    -   Ruan rezervimin me statusin `pending` (në pritje).
    -   Dërgon njoftim me email te admini përmes Nodemailer.
    -   Kthen mesazh suksesi te frontend-i.

### B. Administrimi
1.  **Qasja**: Adminët vizitojnë `/admin` dhe identifikohen përmes `POST /api/login`.
2.  **Siguria**: Një token i thjeshtë (`avana-secret-admin-token-2026`) mbron rrugët e adminit.
3.  **Paneli (Dashboard)**:
    -   **Shiko Rezervimet**: `GET /api/admin/bookings` merr të gjitha rezervimet.
    -   **Menaxho Statusin**: Adminët mund të Konfirmojnë, Anulojnë ose Fshijnë rezervime (`PUT/DELETE`).
    -   **Përditëso Çmimet**: Adminët mund të ndryshojnë çmimin për natë të vilave (`PUT /api/prices/:villaType`).
    -   **Statistikat**: Shikimi i numrit total të rezervimeve, atyre në pritje dhe të konfirmuara (`GET /api/admin/stats`).

---

## 5. Skema e Bazës së të Dhënave

### Tabela `bookings` (Rezervimet)
| Kolona | Tipi | Përshkrimi |
| :--- | :--- | :--- |
| `id` | INTEGER PK | ID Unike |
| `name` | TEXT | Emri i Mysafirit |
| `email` | TEXT | Email-i i Mysafirit |
| `phone` | TEXT | Numri i Kontaktit |
| `checkIn` | TEXT | Data e Hyrjes (YYYY-MM-DD) |
| `checkOut` | TEXT | Data e Daljes (YYYY-MM-DD) |
| `guests` | INTEGER | Numri i mysafirëve |
| `villaType` | TEXT | 'Standard' ose 'Premium' |
| `status` | TEXT | 'pending', 'confirmed', 'cancelled' |
| `createdAt` | DATETIME | Koha e krijimit |

### Tabela `prices` (Çmimet)
| Kolona | Tipi | Përshkrimi |
| :--- | :--- | :--- |
| `id` | INTEGER PK | ID Unike |
| `villaType` | TEXT | Unike ('Standard', 'Premium') |
| `pricePerNight` | REAL | Kosto në EUR |

### Tabela `admins` (Administratorët)
| Kolona | Tipi | Përshkrimi |
| :--- | :--- | :--- |
| `username` | TEXT | Emri i përdoruesit admin |
| `password` | TEXT | Fjalëkalimi (për demonstrim) |

---

## 6. Përmirësimet e Ardhshme (Roadmap)
-   **Siguria**: Kriptimi i fjalëkalimeve me `bcrypt` në vend të ruajtjes tekst të thjeshtë. Implementimi i sesioneve JWT reale.
-   **Pagesat**: Integrimi me Stripe ose PayPal për depozita të menjëhershme.
-   **Kalendari UI**: Kalendar vizual në faqen e rezervimit për të treguar datat e lira.
-   **Shabllone Email-i**: Përdorimi i shablloneve HTML më të avancuara për email-et drejtuar *klientëve* (konfirmimi i rezervimit).
