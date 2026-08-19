/**
 * =========================================================================
 * AgentStudio - Internationalization (i18n) Engine
 * Professional, key-based, scalable localization system (EN / TR)
 * =========================================================================
 */

const I18N_DICTIONARY = {
    en: {
        // Sidebar & General
        "sidebar.title": "Nodes Library",
        "sidebar.language": "Language / Dil",
        "sidebar.workflow_title": "🚀 Fully Automated Batch Pipeline:",
        "sidebar.workflow_desc": "Connect the pins and click <b>'RUN FULL PIPELINE'</b> on Auto Save to batch process hundreds of images and save directly to disk!",
        
        // Node 1: Batch Loader
        "node.batch_loader.title": "Batch Loader",
        "node.batch_loader.subtitle": "Batch File Queue",
        "node.batch_loader.desc": "Queue 1 or 500+ images via folder or multi-file selection without overloading memory.",
        "node.batch_loader.drop_text": "Drop Image Folder or Files Here",
        "node.batch_loader.or_click": "or Click to Select",
        "node.batch_loader.queue_status": "Queue Status",
        "node.batch_loader.no_files": "No files loaded yet",
        "node.batch_loader.files_loaded": "{count} images loaded ({size})",
        "node.batch_loader.btn_select_files": "📁 Select Files",
        "node.batch_loader.btn_select_folder": "📂 Select Folder",
        "node.batch_loader.btn_clear": "Clear",

        // Node 2: Split Assets
        "node.split_assets.title": "Split Assets",
        "node.split_assets.subtitle": "AI Object Detection & Cropping",
        "node.split_assets.desc": "Detects and crops all independent objects and sprites in the image.",
        "node.split_assets.drop_text": "Drop Sheet Image or Connect to Left Pin",
        "node.split_assets.or_click": "Click to Upload",
        "node.split_assets.batch_connected": "Batch Loader Connected",
        "node.split_assets.batch_hint": "Press Run to split in batch",
        "node.split_assets.split_mode": "Cropping Mode:",
        "node.split_assets.mode_whole": "👑 Whole Object (Character + Item)",
        "node.split_assets.mode_balanced": "🔍 Balanced Mode (Main Entities)",
        "node.split_assets.mode_detailed": "🔬 Part / Sub-detail (Deep Split)",
        "node.split_assets.mode_parts": "🧩 Sub-parts & Details (Detailed Split)",
        "node.split_assets.btn_download_all": "📥 Download All Split Assets",
        "node.split_assets.btn_rerun": "🔄 Re-run",
        "node.split_assets.btn_download": "⬇ Download",

        // Node 3: Remove Background
        "node.remove_bg.title": "Remove Background",
        "node.remove_bg.subtitle": "AI Background Matting",
        "node.remove_bg.desc": "Removes backgrounds with high precision hair & edge details using BiRefNet.",
        "node.remove_bg.drop_text": "Drop Image Here or",
        "node.remove_bg.or_click": "Click",
        "node.remove_bg.conn_active": "Connection Active",
        "node.remove_bg.btn_run_all": "RUN FULL PIPELINE",
        "node.remove_bg.settings_toggle": "⚙️ Fine Edge & Mask Settings",
        "node.remove_bg.method_label": "Matting Engine / Mode:",
        "node.remove_bg.method_ai": "🧠 AI Smart Mode (BiRefNet)",
        "node.remove_bg.method_corner": "🎮 Game Icon / Solid Color (Corner Key)",
        "node.remove_bg.keep_inside_label": "🛡️ Protect Icon / Medallion Interior",
        "node.remove_bg.keep_inside_desc": "Prevents hollow cuts inside medallions, frames, and game art.",
        "node.remove_bg.threshold_label": "AI Detection Sensitivity:",
        "node.remove_bg.defringe_label": "Defringe / Choke Halo:",
        "node.remove_bg.feather_label": "Edge Feather / Soften:",
        "node.remove_bg.quality_label": "Processing Resolution / Quality:",
        "node.remove_bg.quality_fast": "⚡ Fast (768px - Low VRAM)",
        "node.remove_bg.quality_balanced": "⚖️ Balanced (1024px - Standard)",
        "node.remove_bg.quality_ultra": "💎 Ultra HD (2048px - Max Detail)",
        "node.remove_bg.output_format": "Output Format:",
        "node.remove_bg.format_rgba": "Transparent PNG",
        "node.remove_bg.format_mask": "Alpha Mask",
        "node.remove_bg.btn_download_single": "Download (PNG)",
        "node.remove_bg.btn_download_all": "📥 Download All Transparent Assets",
        "node.remove_bg.btn_rerun": "🔄 Re-run",

        // Node 3.3: Relight & Atmosphere
        "node.relight.title": "Relight & Atmosphere",
        "node.relight.subtitle": "AI Lighting & Atmosphere",
        "node.relight.desc": "Applies directional studio lighting, rim light, and cinematic atmosphere using IC-Light.",
        "node.relight.preview": "Live Preview",
        "node.relight.drop_hint": "Drag Image Here or Click",
        "node.relight.btn_run": "⚡ Relight Asset",
        "node.relight.btn_run_pipeline": "⚡ RUN FULL PIPELINE",
        "node.relight.btn_download": "⬇ Download",
        "node.relight.btn_download_all": "📥 Download All",
        "node.relight.engine_label": "Processing Engine / AI Mode:",
        "node.relight.engine_fast": "⚡ Fast Mode (Real-time Shader - 0.05s)",
        "node.relight.engine_ai": "🧠 Deep AI Mode (IC-Light Diffusion)",
        "node.relight.preset_label": "Lighting Preset:",
        "node.relight.preset_custom": "🎨 Custom / Manual",
        "node.relight.preset_golden": "🌅 Golden Hour (Sunset)",
        "node.relight.preset_cyberpunk": "🟣 Cyberpunk Neon (Cyan/Magenta)",
        "node.relight.preset_studio": "📸 Studio Softbox (Natural)",
        "node.relight.preset_moonlight": "🌙 Moonlight (Deep Blue)",
        "node.relight.preset_rim": "⚡ Rim Light (Edge Highlight)",
        "node.relight.preset_dramatic": "🎭 Dramatic (High Contrast)",
        "node.relight.direction": "Light Direction:",
        "node.relight.sphere_title": "3D Light Sphere:",
        "node.relight.light_color": "Light Color:",
        "node.relight.intensity": "Intensity:",
        "node.relight.ambient": "Ambient Fill:",
        "node.relight.conn_active": "Connection Active",
        "node.relight.alert_no_input": "Please upload an image to Relight or connect an upstream node to the left pin!",
        "node.relight.alert_pipeline_error": "Pipeline Error: ",

        // Node 3.4: Timeline Sequencer
        "node.timeline.title": "Timeline Sequencer",
        "node.timeline.subtitle": "Keyframe Animation & Sequence Engine",
        "node.timeline.desc": "Generates 64-frame 3D light rotation sequences with Linear/Spline interpolation.",
        "node.timeline.active_label": "Animation:",
        "node.timeline.curve_label": "Curve:",
        "node.timeline.interp_linear": "Linear (Constant)",
        "node.timeline.interp_spline": "Spline (Smooth S-Curve)",
        "node.timeline.interp_ease_in": "Ease In (Slow Start)",
        "node.timeline.interp_ease_out": "Ease Out (Slow Stop)",
        "node.timeline.frame_count": "Frame Count:",
        "node.timeline.fps_label": "Speed / Duration:",
        "node.timeline.btn_render": "⚡ Render Sequence (64 Frames)",
        "node.timeline.btn_download": "📥 Download Sequence",

        // Node 3.5: Resize & Align
        "node.resize.title": "Resize & Align",
        "node.resize.subtitle": "Standardize Resolution & Frame",
        "node.resize.preview": "Live Preview",
        "node.resize.drop_hint": "Drop Image Here or Click to Upload",
        "node.resize.btn_run": "⚡ Run Resize",
        "node.resize.btn_run_pipeline": "⚡ RUN FULL PIPELINE",
        "node.resize.btn_download": "⬇ Download (PNG)",
        "node.resize.btn_download_all": "📥 Download All",
        "node.resize.showing_asset": "Asset {current}/{total}",
        "node.resize.dimensions": "Target Dimensions (W x H):",
        "node.resize.scale_mode": "Scale Mode:",
        "node.resize.mode_fit": "Fit (Preserve Ratio)",
        "node.resize.mode_fill": "Fill (Crop to Fit)",
        "node.resize.mode_stretch": "Stretch (Ignore Ratio)",
        "node.resize.alignment": "Alignment (9-Point):",
        "node.resize.bg": "Background:",
        "node.resize.transparent": "Transparent",
        "node.resize.conn_active": "Connection Active",
        "node.resize.conn_hint": "Press 'Run Full Pipeline' to generate & preview automatically",
        "node.resize.port_input": "Input: Receives assets from upstream node",
        "node.resize.port_output": "Output Pin",
        "node.resize.alert_no_input": "Please upload an image to Resize & Align or connect an upstream node to the left pin!",
        "node.resize.alert_no_root_image": "Pipeline failed: Please ensure an image is loaded in the root node (Split Assets or Batch Loader)!",
        "node.resize.alert_pipeline_error": "Pipeline Error: ",
        "node.resize.desc": "Scales, aligns, and pads output images (e.g. 512x512).",

        // Node 4: Auto Save
        "node.auto_save.title": "Auto Save",
        "node.auto_save.subtitle": "Disk Export Destination",
        "node.auto_save.desc": "Automatically saves all completed assets directly to the target output directory.",
        "node.auto_save.target_folder": "Save Target Directory:",
        "node.auto_save.default_folder": "Default: output/assets",
        "node.auto_save.naming_pattern": "File Naming Pattern:",
        "node.auto_save.name_original": "Original Name + Suffix",
        "node.auto_save.name_numbered": "Numbered (asset_001, asset_002...)",
        "node.auto_save.subfolders": "Organize in Date/Batch Subfolders",
        "node.auto_save.btn_run_pipeline": "⚡ RUN ENTIRE BATCH PIPELINE",
        "node.auto_save.saved_count": "Saved Files: {count}",

        // Model Hub & Statuses
        "model.status.ready": "🟢 Ready",
        "model.status.downloading": "⏳ %{pct}",
        "model.status.error": "❌ Error",
        "model.status.download": "📥 Download Model",
        "model.card.desc": "Model is not downloaded yet. Click download to fetch directly from HuggingFace to your local machine.",
        "model.card.btn_download": "📥 Download Model (~{size})",
        "model.card.btn_retry": "🔄 Retry Download",
        "model.card.error_msg": "Download failed or interrupted.",

        // Status Line & Runtime
        "status.preparing": "Preparing...",
        "status.running_birefnet": "BiRefNet Removing Background...",
        "status.running_split": "Splitting Assets...",
        "status.batch_progress": "[{current}/{total}] Processing {name}...",
        "status.cached_ready": "Assets Ready (Cached) ➔ Processing..."
    },
    tr: {
        // Sidebar & General
        "sidebar.title": "Nodes Library",
        "sidebar.language": "Language / Dil",
        "sidebar.workflow_title": "🚀 Tam Otomatik Toplu Akış:",
        "sidebar.workflow_desc": "Pinleri bağlayıp Auto Save üzerindeki <b>'TÜM AKIŞI ÇALIŞTIR'</b> butonuna basarak yüzlerce görseli tek seferde işleyip diske kaydedebilirsiniz!",

        // Node 1: Batch Loader
        "node.batch_loader.title": "Batch Loader",
        "node.batch_loader.subtitle": "Toplu Dosya Yükleyici",
        "node.batch_loader.desc": "1 veya 500+ görseli klasör/çoklu seçim ile hafızayı kasmadan kuyruğa alır.",
        "node.batch_loader.drop_text": "Görsel Klasörünü veya Dosyaları Buraya Bırakın",
        "node.batch_loader.or_click": "veya Seçmek İçin Tıklayın",
        "node.batch_loader.queue_status": "Kuyruk Durumu",
        "node.batch_loader.no_files": "Henüz dosya yüklenmedi",
        "node.batch_loader.files_loaded": "{count} görsel kuyrukta ({size})",
        "node.batch_loader.btn_select_files": "📁 Dosya Seç",
        "node.batch_loader.btn_select_folder": "📂 Klasör Seç",
        "node.batch_loader.btn_clear": "Temizle",

        // Node 2: Split Assets
        "node.split_assets.title": "Split Assets",
        "node.split_assets.subtitle": "AI Nesne Ayrıştırma & Kırpma",
        "node.split_assets.desc": "Görseldeki tüm bağımsız nesneleri tespit edip ayrı ayrı kırpar.",
        "node.split_assets.drop_text": "Sheet Resmini Sürükle veya Sol Pin'e Bağla",
        "node.split_assets.or_click": "Yüklemek İçin Tıkla",
        "node.split_assets.batch_connected": "Batch Loader Bağlı",
        "node.split_assets.batch_hint": "Çalıştır'a basarak toplu ayrıştırın",
        "node.split_assets.split_mode": "Ayrıştırma Modu:",
        "node.split_assets.mode_whole": "👑 Bütünsel (Adam + Pasta)",
        "node.split_assets.mode_balanced": "🔍 Dengeli Mod (Ana Varlıklar)",
        "node.split_assets.mode_detailed": "🔬 Parça / Detay (Derin Ayrıştırma)",
        "node.split_assets.mode_parts": "🧩 Alt Parçalar & Detaylar (Ayrıntılı Ayrıştır)",
        "node.split_assets.btn_download_all": "📥 Tüm Parçaları İndir",
        "node.split_assets.btn_rerun": "🔄 Yeniden",
        "node.split_assets.btn_download": "⬇ İndir",

        // Node 3: Remove Background
        "node.remove_bg.title": "Remove Background",
        "node.remove_bg.subtitle": "AI Arka Plan Temizleme",
        "node.remove_bg.desc": "BiRefNet ile saç ve kenar detaylarını kusursuz şeffaf yapar.",
        "node.remove_bg.drop_text": "Resmi Buraya Sürükle veya",
        "node.remove_bg.or_click": "Tıkla",
        "node.remove_bg.conn_active": "Bağlantı Aktif",
        "node.remove_bg.btn_run_all": "TÜM AKIŞI BAŞLAT",
        "node.remove_bg.settings_toggle": "⚙️ İnce Kenar & Maske Ayarları",
        "node.remove_bg.method_label": "Temizleme Motoru / Modu:",
        "node.remove_bg.method_ai": "🧠 AI Akıllı Mod (BiRefNet)",
        "node.remove_bg.method_corner": "🎮 Oyun İkonu / Düz Zemin (Corner Key)",
        "node.remove_bg.keep_inside_label": "🛡️ İkon / Madalyon İçini Koru",
        "node.remove_bg.keep_inside_desc": "Madalyon, çerçeve veya simge içindeki detayların silinmesini engeller.",
        "node.remove_bg.threshold_label": "AI Algılama Hassasiyeti:",
        "node.remove_bg.defringe_label": "Kenar Temizle (Halo / Sızıntı):",
        "node.remove_bg.feather_label": "Kenar Yumuşatma (Feather):",
        "node.remove_bg.quality_label": "İşleme Çözünürlüğü / Kalite:",
        "node.remove_bg.quality_fast": "⚡ Hızlı (768px - Düşük VRAM)",
        "node.remove_bg.quality_balanced": "⚖️ Dengeli (1024px - Standart)",
        "node.remove_bg.quality_ultra": "💎 Ultra HD (2048px - Maksimum Detay)",
        "node.remove_bg.output_format": "Çıktı Formatı:",
        "node.remove_bg.format_rgba": "Şeffaf PNG",
        "node.remove_bg.format_mask": "Alpha Maske",
        "node.remove_bg.btn_download_single": "İndir (PNG)",
        "node.remove_bg.btn_download_all": "📥 Tüm Şeffaf Asset'leri İndir",
        "node.remove_bg.btn_rerun": "🔄 Yeniden",

        // Node 3.3: Relight & Atmosphere
        "node.relight.title": "Relight & Atmosphere",
        "node.relight.subtitle": "AI Işık & Ortam Aydınlatma",
        "node.relight.desc": "IC-Light ile yönlü stüdyo ışığı, gün batımı veya neon atmosfer ekler.",
        "node.relight.preview": "Canlı Önizleme",
        "node.relight.drop_hint": "Resmi Buraya Sürükle veya Tıkla",
        "node.relight.btn_run": "⚡ Işıklandır",
        "node.relight.btn_run_pipeline": "⚡ TÜM AKIŞI ÇALIŞTIR",
        "node.relight.btn_download": "⬇ İndir",
        "node.relight.btn_download_all": "📥 Tümünü İndir",
        "node.relight.engine_label": "İşleme Motoru / AI Modu:",
        "node.relight.engine_fast": "⚡ Hızlı Mod (Real-time Shader - 0.05 sn)",
        "node.relight.engine_ai": "🧠 Derin AI Modu (IC-Light Diffusion)",
        "node.relight.preset_label": "Işık Teması / Preset:",
        "node.relight.preset_custom": "🎨 Özel / Manuel Ayar",
        "node.relight.preset_golden": "🌅 Golden Hour (Gün Batımı)",
        "node.relight.preset_cyberpunk": "🟣 Cyberpunk Neon (Cyan/Pembe)",
        "node.relight.preset_studio": "📸 Studio Softbox (Doğal)",
        "node.relight.preset_moonlight": "🌙 Moonlight (Gece Mavisi)",
        "node.relight.preset_rim": "⚡ Rim Light (Arka Vurgu)",
        "node.relight.preset_dramatic": "🎭 Dramatic (Yüksek Kontrast)",
        "node.relight.direction": "Işık Yönü:",
        "node.relight.sphere_title": "3D Işık Küresi:",
        "node.relight.light_color": "Işık Rengi:",
        "node.relight.intensity": "Işık Şiddeti:",
        "node.relight.ambient": "Ortam Işığı:",
        "node.relight.conn_active": "Bağlantı Aktif",
        "node.relight.alert_no_input": "Lütfen önce Relight düğümüne bir resim yükleyin veya sol pine bir düğüm bağlayın!",
        "node.relight.alert_pipeline_error": "Akış Hatası: ",

        // Node 3.4: Timeline Sequencer
        "node.timeline.title": "Timeline Sequencer",
        "node.timeline.subtitle": "Keyframe Animasyon & Sekans Motoru",
        "node.timeline.desc": "Linear veya Spline eğrileriyle 64 karelik 3D ışık animasyonu ve sekans üretir.",
        "node.timeline.active_label": "Animasyon:",
        "node.timeline.curve_label": "Eğri:",
        "node.timeline.interp_linear": "Linear (Doğrusal)",
        "node.timeline.interp_spline": "Spline (Yumuşak S-Eğrisi)",
        "node.timeline.interp_ease_in": "Ease In (Yavaş Başla)",
        "node.timeline.interp_ease_out": "Ease Out (Yavaş Dur)",
        "node.timeline.frame_count": "Kare Sayısı:",
        "node.timeline.fps_label": "Hız / Süre:",
        "node.timeline.btn_render": "⚡ Sekansı Render Al (64 Kare)",
        "node.timeline.btn_download": "📥 Sekansı İndir",

        // Node 3.5: Resize & Align
        "node.resize.title": "Resize & Align",
        "node.resize.subtitle": "Resim Boyutu Standartlaştırma",
        "node.resize.preview": "Canlı Önizleme",
        "node.resize.drop_hint": "Resmi Buraya Sürükle veya Tıkla",
        "node.resize.btn_run": "⚡ Yeniden Boyutlandır",
        "node.resize.btn_run_pipeline": "⚡ TÜM AKIŞI ÇALIŞTIR",
        "node.resize.btn_download": "⬇ İndir (PNG)",
        "node.resize.btn_download_all": "📥 Tümünü İndir",
        "node.resize.showing_asset": "Obje {current}/{total}",
        "node.resize.dimensions": "Hedef Ölçüler (W x H):",
        "node.resize.scale_mode": "Sığdırma Modu:",
        "node.resize.mode_fit": "Fit (Orantılı Sığdır)",
        "node.resize.mode_fill": "Fill (Kırparak Doldur)",
        "node.resize.mode_stretch": "Stretch (Uzat)",
        "node.resize.alignment": "Hizalama (9-Nokta):",
        "node.resize.bg": "Arka Plan:",
        "node.resize.transparent": "Şeffaf",
        "node.resize.conn_active": "Bağlantı Aktif",
        "node.resize.conn_hint": "'Tüm Akışı Çalıştır'a basınca otomatik üretilir ve gösterilir",
        "node.resize.port_input": "Giriş: Önceki düğümden resim alır",
        "node.resize.port_output": "Çıkış Pini",
        "node.resize.alert_no_input": "Lütfen önce Resize & Align düğümüne bir resim yükleyin veya sol pine bir düğüm bağlayın!",
        "node.resize.alert_no_root_image": "Akış çalıştırılamadı: Lütfen en baştaki düğüme (Split Assets veya Batch Loader) bir resim yüklendiğinden emin olun!",
        "node.resize.alert_pipeline_error": "Akış Hatası: ",
        "node.resize.desc": "Çıktı resimlerini (örn. 512x512) boyutlandırır, arka plan ekler ve hizalar.",

        // Node 4: Auto Save
        "node.auto_save.title": "Auto Save",
        "node.auto_save.subtitle": "Diske Otomatik Kaydetme",
        "node.auto_save.desc": "Biten tüm asset'leri otomatik olarak seçilen klasöre kaydeder.",
        "node.auto_save.target_folder": "Hedef Kayıt Dizini:",
        "node.auto_save.default_folder": "Varsayılan: output/assets",
        "node.auto_save.naming_pattern": "Dosya İsimlendirme Formatı:",
        "node.auto_save.name_original": "Orijinal İsim + Ek",
        "node.auto_save.name_numbered": "Numaralı (asset_001, asset_002...)",
        "node.auto_save.subfolders": "Tarih/İşlem Alt Klasörlerine Ayır",
        "node.auto_save.btn_run_pipeline": "⚡ TÜM TOPLU AKIŞI ÇALIŞTIR",
        "node.auto_save.saved_count": "Kaydedilen Dosyalar: {count}",

        // Model Hub & Statuses
        "model.status.ready": "🟢 Hazır",
        "model.status.downloading": "⏳ %{pct}",
        "model.status.error": "❌ Hata",
        "model.status.download": "📥 İndir",
        "model.card.desc": "Model henüz bilgisayarınızda yüklü değil. HuggingFace üzerinden doğrudan indirmek için tıklayın.",
        "model.card.btn_download": "📥 Modeli İndir (~{size})",
        "model.card.btn_retry": "🔄 Tekrar Dene",
        "model.card.error_msg": "İndirme kesildi veya hata oluştu.",

        // Status Line & Runtime
        "status.preparing": "Hazırlanıyor...",
        "status.running_birefnet": "BiRefNet Arka Planı Temizliyor...",
        "status.running_split": "Varlıklar Ayrıştırılıyor...",
        "status.batch_progress": "[{current}/{total}] {name} işleniyor...",
        "status.cached_ready": "Split Assets hazır (Önbellek) ➔ Arka planlar temizleniyor..."
    }
};

class I18nManager {
    constructor() {
        this.currentLang = this.detectLanguage();
    }

    detectLanguage() {
        const saved = localStorage.getItem('agentstudio_lang') || localStorage.getItem('nodeagent_lang');
        if (saved && (saved === 'tr' || saved === 'en')) {
            return saved;
        }
        // Auto-detect browser/OS language
        const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
        return navLang.startsWith('tr') ? 'tr' : 'en';
    }

    t(key, params = {}) {
        const langDict = I18N_DICTIONARY[this.currentLang] || I18N_DICTIONARY.en;
        let text = langDict[key] || I18N_DICTIONARY.en[key] || key;
        
        for (const [paramKey, paramVal] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramVal);
        }
        return text;
    }

    setLanguage(lang) {
        if (!I18N_DICTIONARY[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('agentstudio_lang', lang);
        this.updateDOM();
    }

    getLanguage() {
        return this.currentLang;
    }

    updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.innerHTML = this.t(key);
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.setAttribute('title', this.t(key));
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.setAttribute('placeholder', this.t(key));
            }
        });

        const langSelect = document.getElementById('language-select');
        if (langSelect && langSelect.value !== this.currentLang) {
            langSelect.value = this.currentLang;
        }
    }
}

// Global Singleton Instance
window.i18n = new I18nManager();
