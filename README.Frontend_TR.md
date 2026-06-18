# GeoApp - İstemci (Frontend) Mimarisi ve Detaylı Teknik Dokümantasyonu

GeoApp Frontend; harita tabanlı mekansal veri üretimi, topolojik doğrulama arayüzleri, dinamik güzergah optimizasyonu ve gerçek zamanlı araç simülasyon takibi gibi CBS (GIS) süreçlerini tek bir çatı altında toplayan, **React (Vite)** tabanlı kurumsal bir tek sayfalık uygulamadır (SPA). 

Sistem; harita motoru olarak **OpenLayers** kütüphanesini kullanırken, kullanıcı arayüzü ve reaktif veri bileşenlerinde **PrimeReact** ve **PrimeFlex** ekosisteminden yararlanır.

---

## 🚀 Öne Çıkan Özellikler & Gelişmiş CBS Yetenekleri

### 1. Gelişmiş Harita, GeoServer ve Katman Yönetimi (OpenLayers)
* **GeoServer WMS Entegrasyonu:** Milyonlarca mekansal veri içeren PostGIS tablolarını tarayıcı belleğini şişirmeden performanslı tüketmek adına GeoServer `TileWMS` (`ol/source/TileWMS`) entegrasyonu kullanılır. `Navbar.jsx` ve `RouteLegend.jsx` üzerindeki katman görünürlük anahtarları yardımıyla harita sunucusu üzerindeki katmanlar dinamik olarak açılıp kapatılır.
* **Mekansal Stil ve Dinamik WMS Güncelleme:** `RouteManager.jsx` içerisinden değiştirilen güzergah renkleri veya katman öznitelikleri veritabanına işlendikten sonra arayüzde `refreshWmsLayer()` tetiklenir; böylece GeoServer üzerindeki **SLD (Styled Layer Descriptor)** tabanlı kartografik stiller haritaya anlık olarak yansıtılır.
* **Dinamik Altlık (Basemap) Değişimi:** `Navbar.jsx` üzerinden OSM (OpenStreetMap) standart altlığı ile harici XYZ uydu (Satellite) katmanları arasında topolojik referans kaybı yaşanmadan anlık geçiş sağlanır.
* **Mekansal Çizim Etkileşimleri:** `ol/interaction/Draw` kullanılarak Nokta (Point), Çizgi (LineString) ve Alan (Polygon) geometrileri harita projeksiyonuna (EPSG:3857) uygun olarak çizilir. Çizim bittiğinde geometri verisi backend'in ve PostGIS'in anlayacağı **WKT (Well-Known Text)** formatına dönüştürülerek kaydedilir.
* **Vertex Yakalama (Snap) Desteği:** `ol/interaction/Snap` entegrasyonu sayesinde yeni bir durak eklenirken veya mevcut bir geometri düzenlenirken, imleç otomatik olarak en yakın köşe noktaya (vertex) veya çizgiye kilitlenir. Bu sayede topolojik kopukluklar (gaps) ve çakışmalar (overlaps) önlenir.

### 2. PostGIS Mekansal Çakışma (Spatial Intersect) & Öznitelik Gösterimi
* **Gerçek Zamanlı Çakışma Tespiti (Spatial Join):** Harita üzerinden seçilen herhangi bir geometrinin öznitelikleri `FeaturePopup.jsx` üzerinde sergilenirken, PostGIS motoru üzerinde çalışan `GetIntersectsAsync` algoritmasının sonuçları da listelenir. Seçilen alan veya çizgi ile topolojik olarak çakışan (kesişen) diğer tüm kayıtlı geometriler (`intersectingFeatures`), oluşturan kullanıcı adı ve geometri tipi bilgileriyle birlikte popup içerisinde canlı olarak sunulur.
* **Dinamik Geometri Odaklanması (Focus):** Popup içerisindeki kesişim listesinden veya envanter tablosundan bir öğeye tıklandığında, `focusOnFeature` mekanizması devreye girerek haritayı ilgili nesnenin koordinatlarına otomatik olarak kaydırır (pan/zoom).
* **Kartografik Ölçüm Hesaplamaları:** Çizilen geometrilerin türüne göre (LineString için metrik uzunluk, Polygon için m² cinsinden alan ölçümü) `formatShapeMeasurement` fonksiyonu aracılığıyla dinamik metraj hesaplamaları popup üzerinde gerçek zamanlı gösterilir.

### 3. Sunucu Taraflı Sayfalamalı (Lazy Paged) Enventory Yönetimi
* **Performans Odaklı Lazy Pagination:** `InventoryTable.jsx` bileşeninde yer alan PrimeReact `DataTable` modülü, istemci taraflı yük oluşturmamak adına tamamen **Sunucu Taraflı Sayfalama (Lazy Load)** mimarisiyle çalışır. Sayfa değişimi (`onPage`) veya satır sayısı güncellenmesi durumunda yalnızca ilgili sayfa matrisi (`page`, `pageSize`) backend'deki `/geometries/paged` uç noktasına iletilir ve sadece o sayfaya ait dilim veritabanından çekilir.
* **Eşzamanlı Metin Arama Filtrelemesi:** Envanter tablosundaki arama motoru (`onSearchChange`), girdi değerini doğrudan sayfalama parametrelerine (`search`) ekleyerek sunucu tarafında indeksli alanlar (isim ve notlar) üzerinde gerçek zamanlı LIKE sorguları çalıştırır ve tablo verisini reaktif olarak yeniden yükler.

### 4. Canlı Simülasyon Paneli & Gerçek Zamanlı Telemetri
* **SignalR Hub Bağlantısı:** `SimulationControl.jsx` aracılığıyla yönetilen canlı araç takibi, ASP.NET Core SignalR websocket altyapısını kullanır. İstemci, izlemek istediği rotaya ait izole odaya (`Route_{routeId}`) dahil olur.
* **Asenkron İnterpolasyon ve Akıcı Animasyon:** Backend'deki `SimulationService` tarafından üretilen yüksek yoğunluklu ara koordinat matrisi (`0.001` adım boyutu), SignalR kanalı üzerinden istemciye akar. OpenLayers harita motoru, gelen telemetri verisini anlık olarak işleyerek harita üzerindeki bir vektör marker'ı (`ol/geom/Point`) rota yörüngesi boyunca kesintisiz ve akıcı bir şekilde hareket ettirir.
* **Konum Seçim ve Durum Makinesi:** Simülasyon paneli üç aşamalı bir durum mekanizmasına sahiptir:
  * `selecting`: Kullanıcı haritadan bir simülasyon başlangıç noktası seçer.
  * `ready`: Seçilen nokta backend'deki `FindNearestIndex` algoritmasıyla doğrulanır ve simülasyona hazır hale gelir.
  * `running`: Canlı akış başlar, harita marker'ı hareket eder ve kontrol butonları "Durdur" moduna geçer.

### 5. Dinamik Güzergah & Durak (Route) Yönetimi
* **Sürükle-Bırak Re-indeksleme:** `RouteManager.jsx` bileşeninde yer alan PrimeReact `OrderList` entegrasyonu, durakların (Stops) sırasının fare ile sürüklenerek değiştirilmesini sağlar. Sıralama değiştiği anda istemci backend'deki `reorderStops` API uç noktasını tetikler. Sunucu tarafında tüm durakların `Order` indeksleri güncellenir ve OSRM (Open Source Routing Machine) motoru yeni sıralamaya göre en optimum yol yörüngesini (`LineString`) hesaplar.
* **Satır İçi (Inline) Durak Editörü:** PrimeReact `Inplace` bileşeni kullanılarak, modal kapatılmadan durak isimleri çift tıklama ile düzenlenebilir ve `blur` veya `Enter` anında API'ye senkronize edilir.

### 6. Tematik Analiz Modülü
* **Vektör Analiz Enjeksiyonu:** `ThematicModal.jsx` ile kullanıcının veri yoğunluğunu görselleştirmesi sağlanır. Seçilen katmanın geometrik yapısına göre sunulan analiz yöntemleri:
  * **Nokta (Point):** Yoğunluk analizi için *Isı Haritası (Heatmap)* veya yakın konumdaki noktaları gruplamak için *Kümeleme (Cluster)*.
  * **Çizgi (LineString):** Öznitelik değerlerine göre çizgi kalınlığı/rengi değiştiren *Uzunluk Analizi*.
  * **Alan (Polygon):** Metrekare veya doluluk oranlarına göre alanları renklendiren *Choropleth Analizi*.

### 7. Kurumsal Kimlik Doğrulama & Güvenlik Yaşam Döngüsü
* **Kapsamlı Auth Akışı (`Auth.jsx`):** Login, Register, Forgot Password ve Reset Password ekranları tek bir reaktif durum yapısıyla, akıcı geçiş animasyonlarıyla yönetilir. Şifreleme standartları gereği hassas veriler maskelenerek taşınır.
* **Token Countdown Takip Sistemi:** Kullanıcı sisteme giriş yaptığı anda, JWT token içerisindeki `exp` (expiration) claim değeri çözülür. `TokenCountdown.jsx` bileşeni, kalan oturum süresini saniye saniye hesaplar. Süre kritik seviyeye geldiğinde arayüz uyarı rengi değiştirir (`info` -> `warning` -> `danger`) ve süre bittiğinde local storage'daki token'ları temizleyerek kullanıcıyı güvenli bir şekilde dışarı atar (`handleLogout`).

### 8. Gelişmiş Yönetici (Admin) Paneli ve RBAC (Rol Bazlı Yetkilendirme)
* **Rol ve İzin Matrisi:** Admin panelinde kullanıcıların rolleri dinamik olarak değiştirilebilir. Her role atanmış olan sayfa/buton bazlı izin matrisleri (`userPermissions`) kontrol edilerek, `Navbar.jsx` üzerindeki menü elemanları kullanıcı yetkisine göre çalışma zamanında (runtime) filtrelenir.
* **Mekansal Çit (Geofence) Tanımlama (`ZonePicker.jsx`):** Admin, bir kullanıcıya yetki alanı tanımlamak için harita üzerinde bir Polygon çizer. Bu çizim backend'deki `GeometryService.cs` üzerindeki `Contains` doğrulama bariyerini besler. Kullanıcı bu bölge dışına veri eklemeye çalışırsa sistem hata verir.
* **Gelişmiş Log ve Audit İnceleyici:** Backend'deki `RequestLoggingMiddleware` tarafından yakalanan tüm ham HTTP trafikleri, veritabanı hataları ve audit kayıtları bu panelde sergilenir. JSON formatındaki payload'lar biçimlendirilmiş kod bloğu olarak incelenebilir; şifre gibi hassas veriler arayüzde de `[***]` şeklinde maskelenmiş olarak gelir.

---

## 📁 Proje Klasör Yapısı ve Dosya Rolleri

```text
src/
├── api/
│   ├── api.js               # Axios merkezi istemci yapılandırması & 401 unauth interceptor mekanizması
│   └── routeApi.js          # Güzergah, durak re-order ve OSRM tetikleme süreçlerine özel HTTP tanımları
├── components/
│   ├── EditToolbar.jsx      # Haritadaki bir geometrinin konumunu el ile taşırken (Modify) açılan durum çubuğu
│   ├── FeaturePopup.jsx     # Seçilen nesnenin özniteliklerini, oluşturan bilgisini ve PostGIS kesişim listesini sunan popup
│   ├── InventoryTable.jsx   # Sunucu taraflı (Lazy) sayfalama ve metin arama yapan PrimeReact CBS envanter tablosu
│   ├── Navbar.jsx           # Çizim araçları, snap kontrolü, katman yönetimi ve dil/tema seçim ana menüsü
│   ├── RouteLegend.jsx      # Haritanın sol altında duran, aktif rotaların renk, görünürlük ve düzenleme göstergesi
│   ├── RouteManager.jsx     # Rota oluşturma, renk atama ve durak sıralama (OrderList) yönetim modalı
│   ├── SimulationControl.jsx# Canlı araç simülasyon durumunu (başlat/durdur/nokta seç) yöneten kontrol paneli
│   ├── ThematicModal.jsx    # Katman bazlı (Heatmap, Cluster, Choropleth) CBS analiz seçim modalı
│   ├── TokenCountdown.jsx   # JWT oturum süresini saniye bazlı takip eden ve güvenli çıkış yaptıran sayaç
│   ├── UIExtras.jsx         # Ülke arama (AutoComplete) listeleri ve global silme onay (ConfirmDialog) araçları
│   └── ZonePicker.jsx       # Kullanıcı geofence sınır alanı belirlemek için kullanılan alt harita bileşeni
├── constants/
│   └── constants.js         # Çok dilli (TR/EN) sözlük matrisleri, hata mesajları ve varsayılan ülke koordinatları
├── pages/
│   ├── AdminPanel.jsx       # Kullanıcı yetkilendirme, Geofence atama ve ham backend hata logları izleme sayfası
│   └── Profile.jsx          # Bireysel harita altlığı tercihi, tema ve şifre değiştirme kullanıcı yönetim alanı
├── App.jsx                  # OpenLayers haritasının ilklendirildiği, etkileşimlerin ve ana statelerin tutulduğu kalp bileşen
├── main.jsx                 # Uygulama giriş noktası, PrimeReact temaları ve global stil dosyalarının import alanı
└── App.css                  # CSS Variables tabanlı Light/Dark mode renk paletleri ve responsive grid düzenlemeleri
