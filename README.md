# Sangue

**Sangue**, 1980 Roma'sında geçen hikâye odaklı 2D web platform oyunudur.

## Vertical slice

Oynanabilir prototip şunları içerir:

- Gianlico için idle, yürüyüş, çömelerek yürüyüş ve zıplama kareleri
- Borge ve Elena için idle animasyonu
- Roma / Trastevere sokağı, Bar Arisel, Bianchi dairesi, durak ve Magazzino 17
- Yağmur, parallax şehir silüeti ve sinematik bölüm kartları
- Diyaloglar, bölüm hedefleri ve sahne geçişleri
- Capitolo I: kırmızı hesap defteri
- Capitolo II: Bianchi dairesindeki ipuçları ve Elena'nın tanıklığı
- Capitolo III açılışı: 31 numaralı dolap ve Civitavecchia sevkiyat kaydı
- Eski `sangue-save-v1` kayıtlarını sürdüren sürümlü kayıt verisi

## Çalıştırma

Proje build gerektirmez. ES module kullandığı için yerel bir HTTP sunucusu açmak yeterlidir.

```bash
python -m http.server 8080
```

Ardından:

```
http://localhost:8080
```

## Kontroller

- `A / D` veya `← / →`: hareket
- `SPACE / W / ↑`: zıplama
- `S / ↓`: çömelme
- `E`: etkileşim / diyalog

## Teknik yaklaşım

- Phaser 3
- Vanilla JavaScript
- CSS
- Pixel-art rendering
- Kodla üretilen 24×32 karakter sprite sheet'leri

Özel çizilmiş sprite'lar, ses ve müzik var olan animasyon ve sahne akışına sonradan eklenebilir.

## Sonraki geliştirmeler

- HUD'da önce görev ve ipuçları; ardından can, para ve itibar göstergeleri.
- Envanterde hikâye kanıtları ile kullanılabilir eşyaları ayrı tutma.
- Daireyi güvenli ev işlevine genişletme; yerel kayıt ve hazırlık noktası.
- Dükkânlar ve para ekonomisi; ilerlemeyi kilitleyen zorunlu harcamalardan kaçınma.
- Harita ve otobüs durakları üzerinden keşfedilmiş noktalar arasında hızlı seyahat.
