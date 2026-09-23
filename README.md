# Sangue

**Sangue**, 1980 Roma'sında geçen hikâye odaklı 2D web platform oyunudur.

## Vertical slice

İlk oynanabilir prototip şunları içerir:

- Gianlico Bianchi için koşma ve zıplama
- Pixel-art placeholder karakter ve çevre grafikleri
- Roma / Trastevere atmosferi
- Yağmur, parallax şehir silüeti ve sinematik bölüm kartları
- Leonard “Borge” Arisel ile diyalog sistemi
- Görev / objective HUD
- İlk görev: Magazzino 17'den kırmızı hesap defterini alıp Borge'a dön

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
- `E`: etkileşim / diyalog

## Teknik yaklaşım

- Phaser 3
- Vanilla JavaScript
- CSS
- Pixel-art rendering
- Kodla üretilen geçici sprite'lar

Gerçek sprite-sheet, ses, müzik ve bölüm asset'leri daha sonra mevcut oynanış sistemini değiştirmeden eklenebilir.
