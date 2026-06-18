# GeoApp - Enterprise Full-Stack GIS Automation Platform

<div align="center">
  <p><strong>🌐 Automated Spatial Data Infrastructure | Real-Time Vehicle Simulation | Advanced Analytical Mapping</strong></p>
  <p>
    <a href="#-türkçe-başlangıç-ve-giriş">Türkçe Dokümantasyon</a> • 
    <a href="#-english-getting-started--overview">English Documentation</a>
  </p>
</div>

---

## 🇹🇷 Türkçe: Başlangıç ve Giriş

GeoApp; .NET 8 Web API katmanlı backend mimarisi, PostgreSQL/PostGIS mekansal veritabanı motoru, GeoServer WMS entegrasyonu ve OpenLayers tabanlı zengin React frontend ekosistemini bir araya getiren kurumsal düzeyde bir Coğrafi Bilgi Sistemi (CBS/GIS) otomasyon platformudur.

### 📁 Depo ve Dokümantasyon Yapısı
Proje, mikro-servis ve çok katmanlı yapısı gereği detaylı alt dokümantasyonlara bölünmüştür. İhtiyacınız olan modülün kurulum ve teknik detaylarına aşağıdaki yönlendirme bağlantılarından ulaşabilirsiniz:

* **Genel Mimari**: Proje kök dizinindeki ana mimari yapılandırması.
* **[Backend Dokümantasyonu (TR)](./README.Backend_TR.md)**: .NET 8, EF Core, PostGIS, SignalR mimarisi, OSRM entegrasyonu, mekansal kesişim sorguları (`GetIntersectsAsync`) ve kurumsal loglama iş hatları kurulum adımları.
* **[Frontend Dokümantasyonu (TR)](./README.Frontend_TR.md)**: React (Vite), OpenLayers harita motoru, PrimeReact UI bileşenleri, sunucu taraflı sayfalama (Lazy Pagination) ve SignalR canlı telemetri arayüz detayları.

### 🛠️ Sistem Gereksinimleri & Bağımlılıklar
* **Backend**: .NET 8 SDK, PostgreSQL (v15+) + PostGIS Uzantısı, harici veya yerel OSRM motoru.
* **Frontend**: Node.js (v18.0.0+), npm veya yarn.
* **Harita Sunucusu**: WMS servis katmanları için OGC uyumlu GeoServer entegrasyonu (Port: `8080`).

---

## 🇺🇸 English: Getting Started & Overview

GeoApp is an enterprise-grade Geographic Information System (GIS) automation platform built around a high-performance layered .NET 8 Web API backend, a PostgreSQL/PostGIS spatial database engine, GeoServer WMS infrastructure, and a feature-rich React frontend driven by OpenLayers.

### 📁 Repository & Documentation Directory
To maintain structural clarity across core layers, the repository provides dedicated sub-documentation tracking environment variables, system architecture design, and setup protocols:

* **System Blueprints**: High-level structural definitions tracked at the root repository workspace.
* **[Backend Documentation (EN)](./README.Backend.md)**: In-depth technical review of .NET 8 patterns, EF Core, NetTopologySuite spatial extensions, SignalR hubs, OSRM route injection engines, and relational transactional integrity.
* **[Frontend Documentation (EN)](./README.Frontend.md)**: Detailed mapping of Vite + React components, OpenLayers viewports, PrimeReact server-side lazy pagination grids, and asynchronous real-time tracking animation wrappers.

### 🛠️ Prerequisites & Infrastructure
* **Backend Runtime**: .NET 8 SDK, PostgreSQL (v15+) + PostGIS Spatial extension, Open Source Routing Machine (OSRM) local or remote node instances.
* **Client Architecture**: Node.js (v18.0.0+), npm or yarn package manager.
* **Map Server Hub**: Open Geospatial Consortium (OGC) compliant GeoServer environment servicing map components via `TileWMS` pipelines (Default Port: `8080`).

---

## 🧭 Project Architecture Quick Mapping / Katman İzleme Haritası

```text
GeoApp/ (Root Directory)
│
├── GeoApp/                       # .NET 8 Web API Core Source Base (Backend Source)
├── geo-map-frontend/src/         # React SPA Components & OpenLayers Viewports (Client Source)
│
├── README.md                     # Master Router Documentation (This file)
├── README.Backend.md             # Core System Engine Documentation (English)
├── README.Backend_TR.md          # Sunucu Sistemi ve PostGIS Dokümantasyonu (Türkçe)
├── README.Frontend.md            # Client Engine & Map Interaction Guide (English)
└── README.Frontend_TR.md         # Arayüz ve OpenLayers Harita Rehberi (Türkçe)
