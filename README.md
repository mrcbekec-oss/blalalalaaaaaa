# Sanal Oda

Basit bir web tabanlı "sanal oda" uygulaması.

Özellikler
- Film oynatma (local video URL veya internet kaynakları)
- Sipariş verme (2 dakika gecikmeli teslim simülasyonu)
- Oda içinde nesne yerleştirme ve temizleme
- Arkadaş listesi (basit dizi)
- Fare/dokunmatik gezinti (sürükle ile hareket)

Çalıştırma (gereksinim: Deno)

```powershell
cd "c:\Users\slnbkc\Desktop\MRC\deno ben"
denon run --allow-read --allow-net server.ts
# veya
deno run --allow-read --allow-net server.ts
```

Yerel ağdan erişim için IP adresini kullan: `http://<your-ip>:8000`

Yayınlama (GitHub): Aşağıdaki komutları kullanarak GitHub'a gönderip GitHub Pages üzerinden yayınlayabilirsin.

```bash
cd "c:\Users\slnbkc\Desktop\MRC\deno ben"
# 1) GitHub'da boş bir repo oluştur: https://github.com/new
# 2) Uzaktan ekle ve gönder
git remote add origin https://github.com/USERNAME/sanal-oda.git
git branch -M main
git push -u origin main
```

Daha sonra GitHub repo ayarlarından `Pages` bölümüne gidip `main` branch ve `/(root)` seçerek siteyi aktif edebilirsin.
