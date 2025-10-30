# CS2 Swiss Tournament Manager

Teljes stack webalkalmazás Counter-Strike 2 amatőr esport bajnokságok kezelésére Swiss + Knockout rendszerrel.

## 🎯 Funkciók

- **Swiss rendszerű sorsolás**: Automatikus párosítás 4 fordulón keresztül
- **Knockout (egyenes kieséses) szakasz**: Top 4/8 csapat továbbjutása
- **Élő eredménykezelés**: Meccspontok rögzítése (pl. 16-10)
- **Ranglista számítás**: Buchholz tie-breaker támogatással
- **Modern esport UI**: Sötét téma, neon akcentusok
- **Valós idejű frissítés**: API-alapú kommunikáció

## 🏗️ Technológiai Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- In-memory adatbázis (könnyedén átváltható MongoDB/PostgreSQL-re)
- REST API architecture
- Swiss párosítási algoritmus
- Knockout bracket generálás

### Frontend
- **React 19** + **TypeScript**
- **Tailwind CSS** (dark theme, esport dizájn)
- **React Router** navigációhoz
- **Vite** build tool

## 📦 Telepítés

### 1. Függőségek telepítése

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
npm install
```

### 2. Alkalmazás indítása

**Backend indítása (terminál 1):**
```bash
cd backend
npm run dev
```
Backend futni fog: `http://localhost:3001`

**Frontend indítása (terminál 2):**
```bash
npm run dev
```
Frontend futni fog: `http://localhost:5173`

## 🎮 Használat

### 1. Csapatok hozzáadása
- Nyisd meg az **Admin** oldalt
- Adj hozzá legalább 6-10 csapatot
- A rendszer automatikusan kiszámítja az optimális forduló számot

### 2. Swiss Szakasz
1. Menj a **Swiss Phase** oldalra
2. Kattints a **"Generate Next Round"** gombra
3. Rögzítsd a meccseredményeket (pl. 16-14)
4. Kattints a **"Save"** gombra minden meccshez
5. Ismételd 4 fordulón keresztül

### 3. Knockout Szakasz
1. A Swiss szakasz befejezése után menj a **Knockout** oldalra
2. Kattints a **"Generate Bracket"** gombra
3. A top 4/8 csapat automatikusan bekerül
4. Rögzítsd a bracket meccsek eredményeit

### 4. Ranglista
- A **Dashboard** oldalon mindig látható az aktuális állás
- Rendezés: győzelmek → round különbség → Buchholz score

## 📊 API Endpoints

### Teams
- `POST /api/teams` - Új csapat hozzáadása
- `GET /api/teams` - Összes csapat lekérdezése

### Matches
- `GET /api/matches/current` - Aktuális kör meccsei
- `GET /api/matches/all` - Összes meccs
- `POST /api/matches/result` - Eredmény rögzítése

### Tournament
- `POST /api/tournament/generate-round` - Új Swiss forduló
- `GET /api/tournament/standings` - Ranglista
- `POST /api/tournament/generate-bracket` - Knockout bracket
- `GET /api/tournament/bracket` - Bracket lekérése
- `POST /api/tournament/reset` - Tournament reset

## 🎨 Design Highlights

- **Neon blue/purple/pink** akcentusok
- **Rajdhani** font (esport vibe)
- **Dark theme** (#0a0e27 háttér)
- Responsive design (mobil + desktop)
- Smooth transitions és hover effektek
- Custom scrollbar

## 🔧 Konfiguráció

A rendszer automatikusan alkalmazkodik a csapatok számához:

| Csapatok | Swiss fordulók | Knockout méret |
|----------|---------------|----------------|
| 10+      | 4 forduló     | Top 4          |
| 8-9      | 3 forduló     | Top 4          |
| 6-7      | 3 forduló     | Top 4          |

## 📝 Fejlesztési lehetőségek

- [ ] MongoDB/PostgreSQL integráció
- [ ] WebSocket support (valós idejű frissítés)
- [ ] Admin autentikáció
- [ ] Match chat/comments
- [ ] Export PDF/Excel
- [ ] Stream overlay integráció
- [ ] Email értesítések
- [ ] Multi-tournament support

## 🐛 Hibaelhárítás

**Backend nem indul:**
- Ellenőrizd, hogy a 3001-es port szabad-e
- Futtasd: `cd backend && npm install`

**Frontend nem indul:**
- Ellenőrizd, hogy az 5173-as port szabad-e
- Futtasd: `npm install`

**API hiba:**
- Ellenőrizd, hogy a backend fut-e a 3001-es porton
- Nézd meg a backend console-t hibákért

## 📄 Licenc

MIT License - Free to use and modify

## 👨‍💻 Készítette

Generated with Claude Code
