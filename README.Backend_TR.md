# GeoApp Backend Mimarisi ve Teknik Dokümantasyonu

GeoApp, .NET 8 Web API kullanan katmanlı mimari deseni üzerine kurulmuş, tam yığın (full-stack) bir Coğrafi Bilgi Sistemi (CBS/GIS) otomasyon platformudur. Backend çekirdeği; yerel mekansal geometri doğrulama, geometrik işlemler ve işlem tabanlı (transactional) kalıcılık süreçlerini doğrudan bir PostgreSQL/PostGIS veritabanı örneği üzerinde yönetmek için NetTopologySuite (NTS) kütüphanesinden yararlanır.

---

## 1. Veritabanı ve Veri Erişim Katmanı (Persistence)

### AppDbContext.cs
Veritabanı bağlamı (database context); mekansal uzantıları, küresel çoklu kiracılık (multi-tenant)/veri izolasyonu sınırlarını ve otomatik denetim (audit) tetikleyicilerini koordine eder:

* **PostGIS Uzantısı İlklendirmesi:** Veritabanı sürücüsü katmanında R-tree indekslemeyi ve geometrik hesaplamaları etkinleştirmek için `modelBuilder.HasPostgresExtension("postgis")` kullanarak mekansal motoru kaydeder.
* **Otomatik Geçici Silme (Soft Delete) İş Hattı:** Veri değişim yaşam döngülerini yakalamak için `SaveChangesAsync` metodunu ezerek (override) yeniden yapılandırır. `ISoftDeletable` arayüzünü uygulayan ve silinmek üzere işaretlenen herhangi bir varlık, EF Core Değişiklik Takipçisi (Change Tracker) tarafından yakalanır; değiştirilmiş (modified) duruma getirilir ve kendisine bir UTC zaman damgası (`DeletedAt`) ile birlikte `true` değerli bir `IsDeleted` bayrağı atanır.
* **Küresel Sorgu Filtreleme (Global Query Filtering):** Mekansal ve idari tablolarda (`Users`, `Geometries`, `Routes`, `Stops`, `AuditLogs`) `HasQueryFilter(e => !e.IsDeleted)` kuralını zorunlu kılar. Bu yaklaşım, geçici olarak silinmiş verilerin sonuç kümelerini şişirmesini veya aktif uygulama katmanlarında görünmesini, manuel LINQ filtrelerine gerek kalmaksızın sistematik olarak engeller.
* **Koşullu Benzersiz İndeksler:** `Email` ve `Username` gibi kimlik anahtarları üzerinde `HasFilter("\"IsDeleted\" = false")` aracılığıyla benzersiz kısıtlama filtreleri uygular. Bu sayede, silinmiş (dropped) bir hesaba ait kullanıcı adı veya e-posta, geçmiş veri bütünlüğü korunurken yeni bir kullanıcı tarafından hemen yeniden tescil edilebilir.

### Repositories (Depolar)
* **GeometryRepository.cs:** Temel coğrafi ilkel öğeleri (Points, LineStrings, Polygons) yöneten soyutlanmış depo katmanıdır.
  * `GetIntersectsAsync`, mekansal bir indeks üzerinde geometrik çakışmaları tespit etmek amacıyla `g.Geoloc.Intersects(targetGeom)` üzerinden veritabanı seviyesinde yerel mekansal birleştirmeler (spatial joins) yürütür ve kesişim değerlendirmelerini doğrudan PostGIS motorundan teslim alır.
  * `GetAllPagedAsync`, esnek sorgu parametreleri kullanarak sunucu tarafı sayfalama matrislerini işler. RBAC kapsamını değerlendirerek (Yöneticilerin `targetUserId` aracılığıyla belirli kullanıcıları veya küresel kapsamı incelemesine izin verirken, standart profilleri kişisel veri sınırlarıyla izole eder), arama kriterlerini metin alanlarıyla eşleştirir ve indeksleri `GeometryType` kullanarak filtreler.
* **RouteRepository.cs:** Ağlar ve durak noktaları ile ilgili işlemleri (transactions) yönetir.
  * İstekli yükleme (eager loading) teknikleri, çalışma zamanındaki bellek içi operasyonlarda işlem yükünü azaltmak amacıyla, `GetAllAsync` ve `GetByIdAsync` metotlarında `.Include(r => r.Stops.OrderBy(s => s.Order))` ifadesi ile optimize edilmiştir. Bu komut, ilişkili alt koleksiyonların sıralı ve önceden dizilmiş bir şekilde yapılandırılmasını doğrudan veritabanı motoruna devreder.
  * `DeleteAsync`, bir üst rota varlığı geçici silme işlemine tabi tutulduğunda, ilişkili alt kayıtları (`Stops`) döngüyle kaldırarak ilişkisel temizliği yönetir.
* **UserSettingsRepository.cs:** Bireysel görünüm profillerini hedefleyen deterministik durum senkronizasyon mantığını (`Upsert`) uygular. Mekansal görselleştirme altlık haritalarını (basemaps), istemci yerel ayarlarını (locale), temaları ve sınır belirleyici ülke kayıtlarını depolar.

---

## 2. İş Mantığı Katmanı (CBS Motoru & Kimlik Doğrulama)

### RouteService.cs
Coğrafi nokta verilerini gerçek dünya altyapı sistemlerine bağlayarak çok duraklı yol ağlarını koordine eder.

* **Dinamik Dizi Yeniden İndeksleme (`UpdateStopSortOrderAsync`):** Güncellenmiş istemci tarafı görünüm listelerini yansıtan ilkel koleksiyonları alır, indeks özelliklerini artımlı sayaçlarla eşleştirir, ardışık sıralama indeksleri uygular, hedef diziyi `UpdateStopOrderAsync` aracılığıyla günceller ve rotanın yeniden hesaplanmasını zorunlu kılar.
* **Araya Düğüm Ekleme (`InsertStopToRouteAsync`):** Bir rota arasına yeni bir işaretçi eklendiğinde kaydırma hesaplamalarını gerçekleştirir. Alt işlemleri yürütmeden önce hedef indekste boş bir yer açmak amacıyla, akış yönündeki tüm sonraki duraklar için sıralama değerlerini otomatik olarak artırır (`s.Order++`).
* **OSRM Rota Motoru Entegrasyonu (`RefreshRoutePathAsync`):** Yerelleştirilmiş dizi işaretçilerini biçimlendirilmiş koordinat metni kayıtlarına dönüştürür. Harici bir yerel **OSRM (Open Source Routing Machine)** örneği ile bir HTTP kanalı üzerinden iletişim kurar, dönen GeoJSON koordinat matrisini ayrıştırır ve güncellenmiş yol yörüngesini haritalandırmak için yeni bir NetTopologySuite `LineString` nesnesi oluşturur.

### SimulationService.cs
Düşük gecikmeli, gerçek zamanlı mekansal fizikleri ve durum hesaplamalarını asenkron bir yürütme paradigması kullanarak yönetir.

* **Mekansal Yol İnterpolasyonu (Spatial Path Interpolation):** Harici haritalama servislerinden elde edilen ham rota vektörleri, sürekli görsel animasyon takibini bozan düzensiz aralıklar üretebilir. Bu servis, `Path` geometrisi üzerinde bir NTS `LengthIndexedLine` takip matrisi ilklendirir, toplam coğrafi uzunlukları belirler ve yüksek yoğunluklu, eşit aralıklı adım dizileri oluşturmak için yinelemeli örnekleme adımları (`0.001` adım boyutu) yürütür.
* **Koordinat Senkronizasyonu (`FindNearestIndex`):** Başlangıç girdileri olarak gönderilen uzak nokta tanımlarını kabul eder ve en yakın başlangıç düğümünü tam olarak belirlemek için `Distance()` kontrollerini kullanarak, önceden hesaplanmış adım matrisindeki hedef özellikleri eşleştirip mekansal giriş vektörlerini çözer.
* **Eşzamanlılık ve İş Parçacığı Durumu İptali (Concurrency and Thread State Cancellation):** İşlemsel kapsamları doğrudan benzersiz istemci bağlantı tanımlayıcılarına (`connectionId`) bağlamak için bir `ConcurrentDictionary` kullanır. Aktif bir kanal yeniden bir simülasyon isteği gönderdiğinde, servis önceki yürütme çerçevesini çıkarır, ilgili `CancellationTokenSource` yolu üzerinden derhal bir `Cancel()` çağrısı yapar, geçerliliğini yitirmiş bağlamı boşa çıkarır ve izole bir çalışma alanını temiz bir asenkron iş parçacığı sarmalayıcısı ile tahsis eder.

### AuthService.cs
Bireysel oturumlar genelinde kriptografik kimlikleri ve rol özelliklerini korur.

* **Güvenli Kimlik Tahsisi (`RegisterAsync`):** Kayıt girdilerini, güvenli bir `PasswordHash` üretmek için düz metin değişkenlerini 12 turlu bir BCrypt şifreleme modülüne yönlendirerek işler. Atanan güvenlik şemalarını bağlar (hiçbiri iletilmediğinde varsayılan olarak standart "User" kapsamlarını seçer) ve varsayılan `UserSettingsEntity` durumları gibi bağımlı kayıtları tek bir işlem (transaction) bloğu içinde veri tabanına işler.
* **Oturum Taleplerini İmzalama (`GenerateJwtToken`):** Kimlik bilgilerini doğrular ve ana meta veri alanlarını (`Id`, `Email`, `Username`, `Role`), bir `HmacSha256` anahtar şeması ile imzalanmış şifreli bir veri yüküne (payload) serileştirir.
* **Yaşam Döngüsü Kimlik Kurtarma (`ForgotPassword` / `ResetPassword`):** Güvenli bir şekilde rastgele seçilmiş 32 baytlık onaltılık (hexadecimal) dizeler üretir, jeton (token) karmalarını 64 dakikalık bir geçerlilik penceresi ile doğrudan ilgili profillere kaydeder ve metin bileşenlerini bir `MailKit` SMTP istemci katmanı kullanarak kullanıcılara yönlendirir.

### GeometryService.cs
Gelen veri modelleri üzerinde mekansal kuralları uygulamak için dahili bir mekansal doğrulama sınırı görevi görür.

* **Mekansal Çit Doğrulaması (`Contains`):** Fiziksel veritabanlarını geçersiz coğrafi çit (geofence) giriş kayıtlarına karşı koruyan kurumsal bir güvenlik bariyeri görevi görür. Geometri ekleme veya güncelleme iş akışları sırasında sistem, aktif kullanıcı profiline atanan açık mekansal sınır yapılandırmasını (`Zone`) çeker. `user.Zone.Contains(newGeom)` aracılığıyla mekansal bir değerlendirme çalıştırır. Hedef çizimin herhangi bir noktası veya bölümü atanan bölgenin koordinatlarının dışına düşerse, yürütme döngüsü sonlandırılır ve bir mekansal ihlal istisnası (spatial violation exception) fırlatılır.

---

## 3. Middleware (Ara Katman) ve API Controller Katmanları

### RequestLoggingMiddleware.cs
Aktif uygulama kanalları genelinde gerçek zamanlı denetim ve hata yakalama işlemleri yürütmek üzere tasarlanmış bir HTTP iş hattı denetleyicisidir (pipeline inspector).

* **Girdi Akışı Tamponlaması (`EnableBuffering`):** İstek arabelleklerini erişilebilir, yeniden kullanılabilir geçici depolama alanlarında önbelleğe alarak standart girdi akışlarını değiştirir. Bu, denetim motorunun akış konumu izleyicisini tekrar sıfıra getirmeden (`Position = 0`) önce ham gelen metin verisi dizilerini okumasını, incelemesini ve değerlendirmesini sağlar; böylece veri yükü, standart controller alım iş hatları için tamamen bozulmadan bırakılır.
* **Kimlik Korumalı Sessize Alma:** Hassas işlemleri korumak için gelen istek yollarını değerlendirir. Gelen bir istek yolu `/auth/` rotalarını işaret ediyorsa, günlükleme (logging) motoru gövde parametre dizesini yakalar ve telemetri kayıtlarını genel bir yer tutucu dize ile geçersiz kılar: `[***]`. Bu, düz metin şifrelerin sistem günlüklerine sızmasını önler.
* **Hata Günlükleme Çerçevesi (Exception Logging Framework):** Akış yönündeki görevleri kapsamlı bir `try-catch-finally` bloğu içine alır. Sistem çökmeleri meydana gelirse, bileşen yığın izleme (stack trace) ayrıntılarını yakalar, aktif değişkenleri (`UserId`, `Method`, `Path`, `QueryString`, `StatusCode`) eşleştirir ve yapılandırılmış veri yükünü uzun vadeli `AuditLogs` deposuna kaydeder.

### SimulationHub.cs
Akış yönündeki telemetri yayın kanallarını koordine etmek için optimize edilmiş bir ASP.NET Core **SignalR** merkezidir (hub).

* **Hedefli Kanal Gruplama:** `Groups.AddToGroupAsync` ve `Groups.RemoveFromGroupAsync` aracılığıyla oda izolasyonu kavramlarını uygular. Altyapı, devasa telemetri yüklerini tüm bağlı ağa yayınlamak yerine, açık yolların adını taşıyan mesaj yolları (`Route_{routeId}`) oluşturur. Telemetri yükleri yalnızca o anda ilgili kanal grubunu dinleyen istemci cihazlarına yönlendirir.

### Controllers (Denetleyiciler)
* **AdminController.cs:** `[Authorize(Roles = "Admin")]` özniteliği ile sınırlandırılmıştır. Yetkilendirme özelliklerinin değiştirilmesi, `GetLogsPaged` aracılığıyla yapılandırılmış sunucu tarafı günlüklere erişim, günlük temizleme araçları ve rol yapılandırma eşleştirmeleri dahil olmak üzere yönetim özellikleri sağlar.
* **RoutesController.cs:** Uygulama rota profilleri için yaşam döngüsü olaylarını yönetir; düğüm eklemek, durak indekslerini kaydırmak, belirli durakları kaldırmak ve OSRM hesaplamalarını çağırmak için programatik giriş noktaları sağlar.
* **SimulationController.cs:** Gelen parametreleri asenkron arka plan döngü motoruna aktarılan atomik tetikleyicilere dönüştürerek canlı animasyon yönetimi için bir geçiş kapısı görevi görür.
* **GeometriesController.cs:** Geometrik özellikler üzerindeki CRUD işlemleri, sayfa indeksleme istekleri ve mekansal kesişim (intersect) hesaplamaları için işlem yollarını dışa açar.
