# Taco del Búho – LL Admin testadapter

Det här paketet gör två säkra saker:

1. Taco-sidan får visas inne i `https://ll-admin.pages.dev`.
2. LL Admin kan skicka **privat testinnehåll** till sidan när den visas i förhandsvisningsrutan.

## Det ändrar inte livesidan för vanliga besökare

Adaptern hämtar inget eget innehåll och publicerar inget. Den reagerar bara på ett meddelande från exakt `https://ll-admin.pages.dev` när sidan ligger i LL Admins förhandsvisningsruta.

## Installation med GitHub Desktop

1. Öppna Taco del Búho-repot i GitHub Desktop.
2. Välj **Repository → Show in Explorer**.
3. Kopiera alla filer från detta paket till repots rot, där `index.html` finns.
4. Dubbelklicka `INSTALLERA_LL_ADMIN.bat`.
5. När det står KLART, tryck Enter.
6. Installationsfilerna städas bort automatiskt. GitHub Desktop ska visa:
   - `index.html`
   - `_headers`
   - `ll-admin-adapter.js`
7. Commit och push.
8. Vänta tills Taco-projektets Cloudflare-deployment visar Success.
9. Uppdatera LL Admin och öppna **Testversion**.

Installationsskriptet gör säkerhetskopior av befintlig `index.html` och `_headers`.
