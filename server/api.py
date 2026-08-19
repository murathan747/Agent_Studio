import os
import sys
import io
import time
import shutil
import base64
import threading
import warnings
from typing import List, Optional
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageDraw

# Suppress harmless transformers / library warnings to keep console clean
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
    except Exception:
        pass

from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="NodeAgent Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root directory resolution
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DIR = os.path.join(BASE_DIR, "web")
OUTPUT_DIR = os.path.join(BASE_DIR, "output", "assets")
MODELS_CACHE_DIR = os.path.join(BASE_DIR, "models_cache")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODELS_CACHE_DIR, exist_ok=True)

# Force HuggingFace & Torch cache to stay 100% inside portable models_cache directory
os.environ["HF_HOME"] = MODELS_CACHE_DIR
os.environ["TRANSFORMERS_CACHE"] = MODELS_CACHE_DIR
os.environ["TORCH_HOME"] = MODELS_CACHE_DIR
os.environ["HF_HUB_CACHE"] = os.path.join(MODELS_CACHE_DIR, "hub")
os.environ["HUGGINGFACE_HUB_CACHE"] = os.path.join(MODELS_CACHE_DIR, "hub")

# Mount web directory & static assets
if os.path.exists(WEB_DIR):
    app.mount("/web", StaticFiles(directory=WEB_DIR), name="web")
    css_dir = os.path.join(WEB_DIR, "css")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    js_dir = os.path.join(WEB_DIR, "js")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")

@app.get("/", response_class=HTMLResponse)
async def index():
    index_file = os.path.join(WEB_DIR, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>NodeAgent Studio - index.html bulunamadı</h1>")

# =========================================================================
# MODEL MANAGER & DOWNLOADER SYSTEM (On-Demand Model Hub)
# =========================================================================
MODELS_CONFIG = {
    "birefnet": {
        "id": "birefnet",
        "name": "BiRefNet",
        "title": "BiRefNet (Ultra Hassas Arka Plan Temizleyici)",
        "repo_id": "ZhengPeng7/BiRefNet",
        "dir_name": "birefnet",
        "approx_size": "1.2 GB",
        "description": "Ultra net ve kenar kayıpsız şeffaf PNG üretir."
    },
    "florence2": {
        "id": "florence2",
        "name": "Florence-2",
        "title": "Florence-2 (Sprite & Asset Ayrıştırıcı)",
        "repo_id": "microsoft/Florence-2-base-ft",
        "dir_name": "florence2",
        "approx_size": "900 MB",
        "description": "Sheet ve sahnelerdeki tüm karakter ve nesneleri akıllıca ayıklar."
    },
    "iclight": {
        "id": "iclight",
        "name": "IC-Light",
        "title": "IC-Light (Yapay Zeka Işık & Atmosfer Motoru)",
        "repo_id": "lllyasviel/ic-light",
        "dir_name": "iclight",
        "approx_size": "1.7 GB",
        "description": "Şeffaf nesnelere gerçekçi yönlü stüdyo ve ortam ışığı uygular."
    }
}

model_download_states = {
    "birefnet": {"status": "idle", "percent": 0, "message": "", "error": ""},
    "florence2": {"status": "idle", "percent": 0, "message": "", "error": ""},
    "iclight": {"status": "idle", "percent": 0, "message": "", "error": ""}
}

def is_model_installed(model_key: str) -> bool:
    config = MODELS_CONFIG.get(model_key)
    if not config:
        return False
    target_dir = os.path.join(MODELS_CACHE_DIR, config["dir_name"])
    if not os.path.exists(target_dir):
        return False
    # Check if there are actual model weight files in folder
    for root, dirs, files in os.walk(target_dir):
        for f in files:
            if f.endswith(".safetensors") or f.endswith(".bin") or f == "config.json":
                return True
    return False

def get_model_local_path(model_key: str) -> str:
    config = MODELS_CONFIG[model_key]
    target_dir = os.path.join(MODELS_CACHE_DIR, config["dir_name"])
    if is_model_installed(model_key):
        return target_dir
    return config["repo_id"]

active_download_threads = {}

def run_download_model(model_key: str):
    config = MODELS_CONFIG.get(model_key)
    if not config:
        return
    
    target_dir = os.path.join(MODELS_CACHE_DIR, config["dir_name"])
    os.makedirs(target_dir, exist_ok=True)
    
    state = model_download_states[model_key]
    state["status"] = "downloading"
    state["percent"] = 5
    state["message"] = f"{config['name']} indiriliyor... (%5)"
    state["error"] = ""
    
    print(f"\n📦 [Model Hub] '{config['name']}' Hugging Face üzerinden indiriliyor ({config['approx_size']})...")
    print(f"   📂 Hedef Klasör: {target_dir}")
    
    try:
        from huggingface_hub import snapshot_download
        
        # Threaded progress simulator for responsive UI while snapshot_download runs
        stop_sim = threading.Event()
        def simulate_progress():
            cur = 10
            while not stop_sim.is_set() and cur < 90:
                time.sleep(1.5)
                cur += np.random.randint(4, 9)
                if cur > 90: cur = 90
                if state["status"] == "downloading":
                    state["percent"] = cur
                    state["message"] = f"Dosyalar indiriliyor... (%{cur})"
                    print(f"   ⏳ [Model Hub] {config['name']} indiriliyor: %{cur}")
        
        sim_thread = threading.Thread(target=simulate_progress, daemon=True)
        sim_thread.start()
        
        # 1. Main model weights download
        snapshot_download(
            repo_id=config["repo_id"],
            local_dir=target_dir,
            local_dir_use_symlinks=False
        )
        
        # 2. If IC-Light, also ensure VAE and CLIP components are cached locally
        if model_key == "iclight":
            print(f"   📦 [IC-Light Hub] VAE, CLIP ve UNet altyapı bileşenleri indiriliyor...")
            from diffusers import AutoencoderKL, UNet2DConditionModel
            from transformers import CLIPTextModel, CLIPTokenizer
            AutoencoderKL.from_pretrained('stabilityai/sd-vae-ft-mse', cache_dir=MODELS_CACHE_DIR)
            CLIPTokenizer.from_pretrained('openai/clip-vit-large-patch14', cache_dir=MODELS_CACHE_DIR)
            CLIPTextModel.from_pretrained('openai/clip-vit-large-patch14', cache_dir=MODELS_CACHE_DIR)
            UNet2DConditionModel.from_pretrained(
                'runwayml/stable-diffusion-v1-5', subfolder='unet', in_channels=8,
                cache_dir=MODELS_CACHE_DIR, ignore_mismatched_sizes=True
            )
        
        stop_sim.set()
        state["status"] = "ready"
        state["percent"] = 100
        state["message"] = "Model başarıyla yüklendi ve kullanıma hazır!"
        print(f"✅ [Model Hub] {config['name']} ve tüm yan bileşenleri başarıyla indirildi!\n")
        
    except Exception as ex:
        state["status"] = "error"
        state["error"] = str(ex)
        state["message"] = f"İndirme hatası: {str(ex)}"
        print(f"❌ [Model Hub] {config['name']} indirme hatası: {ex}\n")
    finally:
        active_download_threads.pop(model_key, None)

@app.get("/api/models/status")
def get_all_models_status():
    result = {}
    for key, config in MODELS_CONFIG.items():
        installed = is_model_installed(key)
        is_actively_downloading = (key in active_download_threads and active_download_threads[key].is_alive())
        cur_state = model_download_states.get(key, {"status": "idle", "percent": 0, "message": "", "error": ""})
        
        if is_actively_downloading:
            status = "downloading"
            percent = cur_state["percent"]
            message = cur_state["message"]
        elif installed:
            status = "ready"
            percent = 100
            message = "Model yüklü ve hazır."
        else:
            status = cur_state["status"] if cur_state["status"] == "error" else "idle"
            percent = cur_state["percent"] if cur_state["status"] == "error" else 0
            message = cur_state["message"]
            
        result[key] = {
            "id": key,
            "name": config["name"],
            "title": config["title"],
            "approx_size": config["approx_size"],
            "description": config["description"],
            "installed": installed,
            "status": status,
            "percent": percent,
            "message": message,
            "error": cur_state.get("error", "")
        }
    return result

@app.post("/api/models/download/{model_key}")
def download_model_endpoint(model_key: str):
    if model_key not in MODELS_CONFIG:
        return JSONResponse(status_code=404, content={"error": "Geçersiz model adı"})
        
    if model_key in active_download_threads and active_download_threads[model_key].is_alive():
        return {"status": "already_downloading", "message": "İndirme zaten devam ediyor."}
        
    t = threading.Thread(target=run_download_model, args=(model_key,), daemon=True)
    active_download_threads[model_key] = t
    t.start()
    return {"status": "started", "message": f"{MODELS_CONFIG[model_key]['name']} indirmesi başlatıldı."}

@app.post("/api/models/redownload/{model_key}")
def redownload_model_endpoint(model_key: str):
    if model_key not in MODELS_CONFIG:
        return JSONResponse(status_code=404, content={"error": "Geçersiz model adı"})
        
    # Clear directory and reload
    target_dir = os.path.join(MODELS_CACHE_DIR, MODELS_CONFIG[model_key]["dir_name"])
    if os.path.exists(target_dir):
        try:
            shutil.rmtree(target_dir, ignore_errors=True)
        except Exception:
            pass
            
    t = threading.Thread(target=run_download_model, args=(model_key,), daemon=True)
    active_download_threads[model_key] = t
    t.start()
    return {"status": "started", "message": "Model sıfırlandı ve yeniden indirme başlatıldı."}

# =========================================================================
# 1. BIREFNET (Arka Plan Silici)
# =========================================================================
birefnet_model = None
birefnet_processor = None
birefnet_lock = threading.Lock()

def get_birefnet():
    global birefnet_model, birefnet_processor
    if birefnet_model is None:
        try:
            from transformers import AutoModelForImageSegmentation
            from torchvision import transforms
            import torch
            
            model_path = get_model_local_path("birefnet")
            print(f"🚀 Loading BiRefNet Model from [{model_path}]... (GPU/CUDA checking)")
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            birefnet_model = AutoModelForImageSegmentation.from_pretrained(model_path, trust_remote_code=True)
            birefnet_model.to(device)
            birefnet_model.eval()
            
            birefnet_processor = transforms.Compose([
                transforms.Resize((1024, 1024)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
            print(f"✅ BiRefNet loaded successfully on [{device.upper()}]")
        except Exception as e:
            print(f"❌ Error loading BiRefNet: {e}")
            raise e
    return birefnet_model, birefnet_processor

@app.post("/api/remove-bg")
def remove_bg(
    file: UploadFile = File(...),
    defringe: Optional[int] = Form(0),
    feather: Optional[int] = Form(0),
    quality: Optional[str] = Form("1024"),
    threshold: Optional[float] = Form(0.5),
    keep_inside: Optional[str] = Form("false"),
    method: Optional[str] = Form("ai"),
    output_mode: Optional[str] = Form("rgba")
):
    if not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"error": "Sadece resim dosyası yüklenebilir"})
        
    try:
        from PIL import Image, ImageFilter
        import torch
        import numpy as np
        from scipy import ndimage
        from torchvision import transforms
        
        contents = file.file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # 1. CORNER KEYING / SPRITE COLOR KEY (Düz Zemin / Oyun İkonu Modu)
        if method and method.lower() == "corner_key":
            img_arr = np.array(image)
            H, W = img_arr.shape[:2]
            edge_pixels = np.concatenate([img_arr[0, :], img_arr[-1, :], img_arr[:, 0], img_arr[:, -1]], axis=0)
            bg_color = np.median(edge_pixels, axis=0)
            diff = np.linalg.norm(img_arr.astype(np.float32) - bg_color.astype(np.float32), axis=-1)
            is_bg = diff < 22
            
            # Sadece dış kenarlara bağlı olan zemin piksellerini flood fill ile bul
            labeled, num_features = ndimage.label(is_bg)
            boundary_labels = set(np.unique(np.concatenate([labeled[0, :], labeled[-1, :], labeled[:, 0], labeled[:, -1]])))
            boundary_labels.discard(0)
            outer_bg_mask = np.isin(labeled, list(boundary_labels))
            final_mask_arr = (~outer_bg_mask).astype(np.uint8) * 255
            mask = Image.fromarray(final_mask_arr, mode='L')
        else:
            # 2. AI BIREFNET MODU
            with birefnet_lock:
                model, default_processor = get_birefnet()
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
                
                target_dim = 1024
                if str(quality) == "2048":
                    target_dim = 2048
                elif str(quality) == "768":
                    target_dim = 768
                    
                if target_dim != 1024:
                    proc = transforms.Compose([
                        transforms.Resize((target_dim, target_dim)),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
                    ])
                else:
                    proc = default_processor
                
                input_images = proc(image).unsqueeze(0).to(device)
                input_images = input_images.to(dtype=next(model.parameters()).dtype)
                
                with torch.no_grad():
                    preds = model(input_images)[-1].sigmoid().cpu()
                    
                pred = preds[0].squeeze()
                pred_arr = pred.numpy()
                
                # Eşik Değeri (Threshold) Uygulama
                t_val = float(threshold) if threshold is not None else 0.5
                t_val = max(0.05, min(0.95, t_val))
                binary_mask = (pred_arr >= t_val)
                
                # İkon / Madalyon İçini Koru (Fill Holes)
                if str(keep_inside).lower() in ("true", "1", "yes"):
                    binary_mask = ndimage.binary_fill_holes(binary_mask)
                    
                mask_arr = (binary_mask.astype(np.uint8) * 255)
                mask = Image.fromarray(mask_arr, mode='L').resize(image.size, Image.Resampling.BILINEAR)
                
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
        
        # Post-processing edge refinements
        if defringe and int(defringe) > 0:
            filter_size = max(3, 2 * int(defringe) + 1)
            mask = mask.filter(ImageFilter.MinFilter(filter_size))
            
        if feather and int(feather) > 0:
            mask = mask.filter(ImageFilter.GaussianBlur(radius=float(feather)))
            
        if output_mode and output_mode.lower() == "mask":
            output_image = mask.convert("RGB")
        else:
            image.putalpha(mask)
            output_image = image
            
        buf = io.BytesIO()
        output_image.save(buf, format='PNG')
        buf.seek(0)
        
        return Response(content=buf.read(), media_type="image/png")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# =========================================================================
# 2. FLORENCE-2 (Sheet & Asset Ayrıştırıcı)
# =========================================================================
florence2_model = None
florence2_processor = None
florence2_lock = threading.Lock()

def get_florence2():
    global florence2_model, florence2_processor
    if florence2_model is None:
        try:
            import transformers
            from transformers.models.roberta.tokenization_roberta import RobertaTokenizer
            from transformers import AutoProcessor, AutoModelForCausalLM
            import torch
            
            if not hasattr(transformers.PretrainedConfig, "forced_bos_token_id"):
                transformers.PretrainedConfig.forced_bos_token_id = None
            if not hasattr(RobertaTokenizer, "additional_special_tokens"):
                RobertaTokenizer.additional_special_tokens = property(
                    lambda self: [t for t in self.all_special_tokens if t not in [self.bos_token, self.eos_token, self.unk_token, self.sep_token, self.pad_token, self.cls_token, self.mask_token]]
                )
            
            model_path = get_model_local_path("florence2")
            print(f"🚀 Loading Florence-2 Model from [{model_path}]... (GPU/CUDA checking)")
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            
            florence2_processor = AutoProcessor.from_pretrained(model_path, trust_remote_code=True)
            
            try:
                florence2_model = AutoModelForCausalLM.from_pretrained(model_path, trust_remote_code=True).to(device)
            except AttributeError as e:
                if "_supports_sdpa" in str(e):
                    for mod_name, mod in list(sys.modules.items()):
                        if "modeling_florence2" in mod_name:
                            if hasattr(mod, "Florence2ForConditionalGeneration"):
                                mod.Florence2ForConditionalGeneration._supports_sdpa = True
                                orig_prepare = mod.Florence2ForConditionalGeneration.prepare_inputs_for_generation
                                def patched_prepare(self, *args, **kwargs):
                                    if "past_key_values" in kwargs and kwargs["past_key_values"] is not None:
                                        pkv = kwargs["past_key_values"]
                                        if not isinstance(pkv, tuple):
                                            if hasattr(pkv, "get_seq_length") and pkv.get_seq_length() == 0:
                                                kwargs["past_key_values"] = None
                                            else:
                                                kwargs["past_key_values"] = tuple(pkv)
                                    return orig_prepare(self, *args, **kwargs)
                                mod.Florence2ForConditionalGeneration.prepare_inputs_for_generation = patched_prepare
                                
                            if hasattr(mod, "Florence2LanguageForConditionalGeneration"):
                                orig_lang_prepare = mod.Florence2LanguageForConditionalGeneration.prepare_inputs_for_generation
                                def patched_lang_prepare(self, *args, **kwargs):
                                    if "past_key_values" in kwargs and kwargs["past_key_values"] is not None:
                                        pkv = kwargs["past_key_values"]
                                        if not isinstance(pkv, tuple):
                                            if hasattr(pkv, "get_seq_length") and pkv.get_seq_length() == 0:
                                                kwargs["past_key_values"] = None
                                            else:
                                                kwargs["past_key_values"] = tuple(pkv)
                                    return orig_lang_prepare(self, *args, **kwargs)
                                mod.Florence2LanguageForConditionalGeneration.prepare_inputs_for_generation = patched_lang_prepare
                                
                    florence2_model = AutoModelForCausalLM.from_pretrained(model_path, trust_remote_code=True).to(device)
            
            if hasattr(florence2_model, "language_model") and hasattr(florence2_model.language_model, "model") and hasattr(florence2_model.language_model.model, "shared"):
                shared_w = florence2_model.language_model.model.shared.weight
                florence2_model.language_model.model.encoder.embed_tokens.weight = shared_w
                florence2_model.language_model.model.decoder.embed_tokens.weight = shared_w
                florence2_model.language_model.lm_head.weight = shared_w
            
            florence2_model.eval()
            print(f"✅ Florence-2 loaded successfully on [{device.upper()}]")
        except Exception as e:
            print(f"❌ Error loading Florence-2: {e}")
            raise e
    return florence2_model, florence2_processor

@app.post("/api/split-assets")
def split_assets(
    file: UploadFile = File(...),
    deep_split: Optional[str] = Form("false"),
    split_mode: Optional[str] = Form("balanced")
):
    if not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"error": "Sadece resim dosyası yüklenebilir"})
        
    try:
        from PIL import Image
        import torch
        
        mode = split_mode.lower() if split_mode else ("detailed" if str(deep_split).lower() == "true" else "balanced")
        
        contents = file.file.read()
        original_image = Image.open(io.BytesIO(contents))
        
        if original_image.mode not in ("RGB", "RGBA"):
            original_image = original_image.convert("RGBA")
            
        w, h = original_image.size
        max_dim = max(w, h)
        
        square_rgba = Image.new("RGBA", (max_dim, max_dim), (255, 255, 255, 0))
        offset_x = (max_dim - w) // 2
        offset_y = (max_dim - h) // 2
        
        if original_image.mode == "RGBA":
            square_rgba.paste(original_image, (offset_x, offset_y), original_image)
        else:
            square_rgba.paste(original_image, (offset_x, offset_y))
            
        square_rgb = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
        if original_image.mode == "RGBA":
            square_rgb.paste(square_rgba, (0, 0), square_rgba)
        else:
            square_rgb.paste(square_rgba, (0, 0))
            
        model_input_image = square_rgb.resize((768, 768), Image.Resampling.LANCZOS)
        
        # Projeksiyon tabanlı sprite çıkarıcı
        def extract_sheet_sprites(pil_image):
            img_rgb = pil_image.convert('RGB')
            arr = np.array(img_rgb)
            H, W = arr.shape[:2]
            
            edge_pixels = np.concatenate([arr[0, :], arr[-1, :], arr[:, 0], arr[:, -1]], axis=0)
            bg_color = np.median(edge_pixels, axis=0)
            
            color_diff = np.linalg.norm(arr.astype(np.float32) - bg_color.astype(np.float32), axis=-1)
            is_bg = color_diff < 18
            
            row_bg_ratio = is_bg.mean(axis=1)
            row_spans = []
            in_row = False
            start_y = 0
            for y in range(H):
                if row_bg_ratio[y] < 0.99:
                    if not in_row:
                        in_row = True
                        start_y = y
                else:
                    if in_row:
                        if y - start_y > 25:
                            row_spans.append((start_y, y))
                        in_row = False
            if in_row and (H - start_y > 25):
                row_spans.append((start_y, H))
                
            sprites = []
            for (y1, y2) in row_spans:
                row_bg = is_bg[y1:y2, :]
                col_bg_ratio = row_bg.mean(axis=0)
                
                in_col = False
                start_x = 0
                for x in range(W):
                    if col_bg_ratio[x] < 0.99:
                        if not in_col:
                            in_col = True
                            start_x = x
                    else:
                        if in_col:
                            if x - start_x > 25:
                                sub_bg = is_bg[y1:y2, start_x:x]
                                active_y = np.where(~sub_bg.all(axis=1))[0]
                                active_x = np.where(~sub_bg.all(axis=0))[0]
                                if len(active_y) > 0 and len(active_x) > 0:
                                    ry1 = y1 + active_y[0]
                                    ry2 = y1 + active_y[-1] + 1
                                    rx1 = start_x + active_x[0]
                                    rx2 = start_x + active_x[-1] + 1
                                    sprites.append((rx1, ry1, rx2, ry2))
                            in_col = False
                if in_col and (W - start_x > 25):
                    sub_bg = is_bg[y1:y2, start_x:W]
                    active_y = np.where(~sub_bg.all(axis=1))[0]
                    active_x = np.where(~sub_bg.all(axis=0))[0]
                    if len(active_y) > 0 and len(active_x) > 0:
                        ry1 = y1 + active_y[0]
                        ry2 = y1 + active_y[-1] + 1
                        rx1 = start_x + active_x[0]
                        rx2 = start_x + active_x[-1] + 1
                        sprites.append((rx1, ry1, rx2, ry2))
                        
            return sprites

        sheet_sprites = []
        if mode == "whole":
            try:
                sheet_sprites = extract_sheet_sprites(original_image)
            except Exception as ex:
                pass

        if mode == "whole" and len(sheet_sprites) > 1:
            bboxes = sheet_sprites
            labels = [f"asset_{i+1}" for i in range(len(sheet_sprites))]
            use_original_coords = True
        else:
            use_original_coords = False
            with florence2_lock:
                model, processor = get_florence2()
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
                
                def run_model(prompt_text, task_tag):
                    inp = processor(text=prompt_text, images=model_input_image, return_tensors="pt").to(device)
                    inp["pixel_values"] = inp["pixel_values"].to(model.dtype)
                    with torch.no_grad():
                        g_ids = model.generate(
                            input_ids=inp["input_ids"],
                            pixel_values=inp["pixel_values"],
                            max_new_tokens=1024,
                            do_sample=False,
                            num_beams=3
                        )
                    g_text = processor.batch_decode(g_ids, skip_special_tokens=False)[0]
                    return processor.post_process_generation(g_text, task=task_tag, image_size=(max_dim, max_dim))

                raw_bboxes = []
                raw_labels = []

                if mode == "whole":
                    od_res = run_model("<OD>", "<OD>").get("<OD>", {})
                    od_boxes = od_res.get('bboxes', [])
                    od_labels = od_res.get('labels', [])
                    
                    caption_res = run_model("<CAPTION>", "<CAPTION>")
                    caption_text = caption_res.get("<CAPTION>", "")
                    pg_boxes = []
                    pg_labels = []
                    if caption_text:
                        grounding_prompt = f"<CAPTION_TO_PHRASE_GROUNDING>{caption_text}"
                        pg_res = run_model(grounding_prompt, "<CAPTION_TO_PHRASE_GROUNDING>").get("<CAPTION_TO_PHRASE_GROUNDING>", {})
                        pg_boxes = pg_res.get('bboxes', [])
                        pg_labels = pg_res.get('labels', [])

                    raw_bboxes = list(od_boxes) + list(pg_boxes)
                    raw_labels = list(od_labels) + list(pg_labels)

                elif mode == "balanced":
                    caption_res = run_model("<CAPTION>", "<CAPTION>")
                    caption_text = caption_res.get("<CAPTION>", "")
                    if caption_text:
                        grounding_prompt = f"<CAPTION_TO_PHRASE_GROUNDING>{caption_text}"
                        parsed_answer = run_model(grounding_prompt, "<CAPTION_TO_PHRASE_GROUNDING>").get("<CAPTION_TO_PHRASE_GROUNDING>", {})
                        raw_bboxes = parsed_answer.get('bboxes', [])
                        raw_labels = parsed_answer.get('labels', [])
                    if not raw_bboxes:
                        od_res = run_model("<OD>", "<OD>").get("<OD>", {})
                        raw_bboxes = od_res.get('bboxes', [])
                        raw_labels = od_res.get('labels', [])

                else: # mode == "detailed"
                    det_caption_res = run_model("<DETAILED_CAPTION>", "<DETAILED_CAPTION>")
                    det_text = det_caption_res.get("<DETAILED_CAPTION>", "")
                    if det_text:
                        grounding_prompt = f"<CAPTION_TO_PHRASE_GROUNDING>{det_text}"
                        parsed_answer = run_model(grounding_prompt, "<CAPTION_TO_PHRASE_GROUNDING>").get("<CAPTION_TO_PHRASE_GROUNDING>", {})
                        raw_bboxes = parsed_answer.get('bboxes', [])
                        raw_labels = parsed_answer.get('labels', [])
                    if not raw_bboxes:
                        od_res = run_model("<DENSE_REGION_CAPTION>", "<DENSE_REGION_CAPTION>").get("<DENSE_REGION_CAPTION>", {})
                        raw_bboxes = od_res.get('bboxes', [])
                        raw_labels = od_res.get('labels', [])

                GENERIC_LABELS = {
                    'drawing', 'a drawing', 'the drawing',
                    'image', 'an image', 'the image',
                    'photo', 'a photo', 'the photo',
                    'picture', 'a picture', 'the picture',
                    'illustration', 'an illustration', 'the illustration',
                    'sketch', 'a sketch', 'the sketch',
                    'painting', 'a painting', 'the painting',
                    'background', 'a background', 'the background',
                    'canvas', 'a canvas', 'the canvas'
                }
                total_canvas_area = max_dim * max_dim
                
                valid_candidates = []
                for b, l in zip(raw_bboxes, raw_labels):
                    clean_label = l.strip().lower()
                    x1, y1, x2, y2 = b
                    bw = max(0, x2 - x1)
                    bh = max(0, y2 - y1)
                    area = bw * bh
                    
                    if len(raw_bboxes) > 1:
                        if clean_label in GENERIC_LABELS:
                            continue
                        if bw > (0.85 * max_dim) or area > (0.68 * total_canvas_area):
                            continue
                    if area < 300:
                        continue
                    valid_candidates.append((b, clean_label, area))

                deduped = []
                for b1, l1, a1 in valid_candidates:
                    x1_a, y1_a, x2_a, y2_a = b1
                    is_duplicate = False
                    for b2, l2, a2 in deduped:
                        x1_b, y1_b, x2_b, y2_b = b2
                        ix1 = max(x1_a, x1_b); iy1 = max(y1_a, y1_b); ix2 = min(x2_a, x2_b); iy2 = min(y2_a, y2_b)
                        if ix2 > ix1 and iy2 > iy1:
                            inter = (ix2 - ix1) * (iy2 - iy1)
                            union = a1 + a2 - inter
                            iou = inter / union if union > 0 else 0
                            if iou > 0.45:
                                is_duplicate = True
                                break
                    if not is_duplicate:
                        deduped.append((b1, l1, a1))

                if mode == "whole" and len(deduped) > 1:
                    final_keep = []
                    for i, (b1, l1, a1) in enumerate(deduped):
                        x1_a, y1_a, x2_a, y2_a = b1
                        center_x_a = (x1_a + x2_a) / 2
                        center_y_a = (y1_a + y2_a) / 2
                        is_sub_object = False

                        for j, (b2, l2, a2) in enumerate(deduped):
                            if i == j: continue
                            x1_b, y1_b, x2_b, y2_b = b2
                            ix1 = max(x1_a, x1_b); iy1 = max(y1_a, y1_b); ix2 = min(x2_a, x2_b); iy2 = min(y2_a, y2_b)
                            if ix2 > ix1 and iy2 > iy1:
                                inter = (ix2 - ix1) * (iy2 - iy1)
                                overlap_ratio = inter / a1 if a1 > 0 else 0
                                center_inside = (x1_b <= center_x_a <= x2_b) and (y1_b <= center_y_a <= y2_b)
                                if a2 > (a1 * 1.2) and (overlap_ratio > 0.25 or center_inside):
                                    is_sub_object = True
                                    break
                        if not is_sub_object:
                            final_keep.append((b1, l1))
                    bboxes = [k[0] for k in final_keep]
                    labels = [k[1] for k in final_keep]

                elif mode == "balanced" and len(deduped) > 1:
                    final_keep = []
                    for i, (b1, l1, a1) in enumerate(deduped):
                        x1_a, y1_a, x2_a, y2_a = b1
                        is_sub_object = False
                        for j, (b2, l2, a2) in enumerate(deduped):
                            if i == j: continue
                            x1_b, y1_b, x2_b, y2_b = b2
                            ix1 = max(x1_a, x1_b); iy1 = max(y1_a, y1_b); ix2 = min(x2_a, x2_b); iy2 = min(y2_a, y2_b)
                            if ix2 > ix1 and iy2 > iy1:
                                inter = (ix2 - ix1) * (iy2 - iy1)
                                if a1 > 0 and (inter / a1) > 0.45 and a2 > (a1 * 1.3):
                                    is_sub_object = True
                                    break
                        if not is_sub_object:
                            final_keep.append((b1, l1))
                    bboxes = [k[0] for k in final_keep]
                    labels = [k[1] for k in final_keep]

                else: # mode == "detailed"
                    bboxes = [k[0] for k in deduped]
                    labels = [k[1] for k in deduped]
                
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
        
        assets = []
        for i, (label, bbox) in enumerate(zip(labels, bboxes)):
            x1, y1, x2, y2 = map(int, bbox)
            
            if use_original_coords:
                pad = 4
                cx1 = max(0, x1 - pad)
                cy1 = max(0, y1 - pad)
                cx2 = min(w, x2 + pad)
                cy2 = min(h, y2 + pad)
                cropped = original_image.crop((cx1, cy1, cx2, cy2))
            else:
                pad = 10
                cx1 = max(0, x1 - pad)
                cy1 = max(0, y1 - pad)
                cx2 = min(max_dim, x2 + pad)
                cy2 = min(max_dim, y2 + pad)
                cropped = square_rgba.crop((cx1, cy1, cx2, cy2))
            
            cw, ch = cropped.size
            final_size = max(cw, ch) + 20
            
            final_canvas = Image.new("RGBA" if original_image.mode == "RGBA" else "RGB", (final_size, final_size), (0, 0, 0, 0))
            fc_x = (final_size - cw) // 2
            fc_y = (final_size - ch) // 2
            
            if original_image.mode == "RGBA":
                final_canvas.paste(cropped, (fc_x, fc_y), cropped)
            else:
                final_canvas.paste(cropped, (fc_x, fc_y))
                
            buf = io.BytesIO()
            final_canvas.save(buf, format='PNG')
            base64_str = base64.b64encode(buf.getvalue()).decode('utf-8')
            
            safe_label = label.replace(" ", "_").lower()
            assets.append({
                "name": f"{safe_label}_{i}.png",
                "label": label,
                "data": f"data:image/png;base64,{base64_str}"
            })
            
        return {"status": "success", "count": len(assets), "assets": assets}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


# =========================================================================
# 4. RESIZE & ALIGN NODE
# =========================================================================
@app.post("/api/resize")
def resize_image_endpoint(
    file: UploadFile = File(...),
    target_w: int = Form(512),
    target_h: int = Form(512),
    scale_mode: str = Form("fit"),
    align_x: str = Form("center"),
    align_y: str = Form("center"),
    bg_color: str = Form("transparent")
):
    if not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"error": "Sadece resim dosyası yüklenebilir"})
        
    try:
        from PIL import Image, ImageColor
        
        contents = file.file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGBA")
        
        # 1. Hedef Tuvali (Arka Plan) Oluştur
        if bg_color.lower() == "transparent":
            bg_rgba = (0, 0, 0, 0)
        else:
            try:
                bg_rgba = ImageColor.getcolor(bg_color, "RGBA")
            except Exception:
                bg_rgba = (0, 0, 0, 0)
                
        canvas = Image.new("RGBA", (target_w, target_h), bg_rgba)
        
        orig_w, orig_h = image.size
        
        # 2. Ölçekleme (Scaling)
        if scale_mode == "stretch":
            new_img = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
        elif scale_mode == "fill":
            # Crop to fill
            ratio_w = target_w / orig_w
            ratio_h = target_h / orig_h
            scale = max(ratio_w, ratio_h)
            
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)
            resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            left = (new_w - target_w) // 2
            top = (new_h - target_h) // 2
            right = left + target_w
            bottom = top + target_h
            new_img = resized.crop((left, top, right, bottom))
        else:
            # "fit" (Contain)
            ratio_w = target_w / orig_w
            ratio_h = target_h / orig_h
            scale = min(ratio_w, ratio_h)
            
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)
            new_img = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        # 3. Hizalama (Alignment)
        if scale_mode != "stretch" and scale_mode != "fill":
            img_w, img_h = new_img.size
            
            # X axis
            if align_x == "left":
                paste_x = 0
            elif align_x == "right":
                paste_x = target_w - img_w
            else: # center
                paste_x = (target_w - img_w) // 2
                
            # Y axis
            if align_y == "top":
                paste_y = 0
            elif align_y == "bottom":
                paste_y = target_h - img_h
            else: # center
                paste_y = (target_h - img_h) // 2
                
            canvas.paste(new_img, (paste_x, paste_y), new_img)
        else:
            # Stretch or Fill completely covers the canvas, so no alignment offsets needed
            canvas.paste(new_img, (0, 0), new_img)
            
        buf = io.BytesIO()
        canvas.save(buf, format='PNG')
        buf.seek(0)
        
        return Response(content=buf.read(), media_type="image/png")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# =========================================================================
# 2.6. RELIGHT & ATMOSPHERE ENGINE (Directional, Normal Shading & IC-Light)
# =========================================================================
def hex_to_rgb(hex_str: str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    if len(hex_str) == 6:
        return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))
    return (255, 255, 255)

_iclight_pipeline = None

def get_iclight_ai_models():
    global _iclight_pipeline
    if _iclight_pipeline is not None:
        return _iclight_pipeline
    
    import torch
    import safetensors.torch as sf
    from diffusers import StableDiffusionPipeline, AutoencoderKL, UNet2DConditionModel, DPMSolverMultistepScheduler
    from transformers import CLIPTextModel, CLIPTokenizer
    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    dtype = torch.float16 if device == 'cuda' else torch.float32
    
    print(f"📦 [IC-Light AI] Model bileşenleri VRAM'e aktarılıyor ({device.upper()} {dtype})...")
    base_model = 'runwayml/stable-diffusion-v1-5'
    tokenizer = CLIPTokenizer.from_pretrained(base_model, subfolder='tokenizer', cache_dir=MODELS_CACHE_DIR)
    text_encoder = CLIPTextModel.from_pretrained(base_model, subfolder='text_encoder', cache_dir=MODELS_CACHE_DIR, torch_dtype=dtype).to(device)
    vae = AutoencoderKL.from_pretrained(base_model, subfolder='vae', cache_dir=MODELS_CACHE_DIR, torch_dtype=dtype).to(device)
    unet = UNet2DConditionModel.from_pretrained(base_model, subfolder='unet', cache_dir=MODELS_CACHE_DIR, torch_dtype=dtype).to(device)
    
    # Modify conv_in to 8 channels
    with torch.no_grad():
        new_conv_in = torch.nn.Conv2d(8, unet.conv_in.out_channels, unet.conv_in.kernel_size, unet.conv_in.stride, unet.conv_in.padding)
        new_conv_in.weight.zero_()
        new_conv_in.weight[:, :4, :, :].copy_(unet.conv_in.weight)
        new_conv_in.bias = unet.conv_in.bias
        unet.conv_in = new_conv_in.to(device=device, dtype=dtype)
        
    # Merge IC-Light offset weights into base UNet
    offset_path = os.path.join(MODELS_CACHE_DIR, 'iclight', 'iclight_sd15_fc.safetensors')
    if os.path.exists(offset_path):
        sd_offset = sf.load_file(offset_path)
        sd_origin = unet.state_dict()
        sd_merged = {k: sd_origin[k] + sd_offset[k].to(sd_origin[k].device, dtype=sd_origin[k].dtype) for k in sd_origin.keys()}
        unet.load_state_dict(sd_merged, strict=True)
        del sd_offset, sd_origin, sd_merged
        
    unet_orig_forward = unet.forward
    def hooked_forward(sample, timestep, encoder_hidden_states, **kwargs):
        c_concat = kwargs['cross_attention_kwargs']['concat_conds'].to(sample)
        c_concat = torch.cat([c_concat] * (sample.shape[0] // c_concat.shape[0]), dim=0)
        new_sample = torch.cat([sample, c_concat], dim=1)
        kwargs['cross_attention_kwargs'] = {}
        return unet_orig_forward(new_sample, timestep, encoder_hidden_states, **kwargs)

    unet.forward = hooked_forward

    scheduler = DPMSolverMultistepScheduler(
        num_train_timesteps=1000, beta_start=0.00085, beta_end=0.012, beta_schedule='scaled_linear',
        algorithm_type='sde-dpmsolver++', use_karras_sigmas=True, steps_offset=1
    )

    from diffusers import StableDiffusionImg2ImgPipeline
    t2i_pipe = StableDiffusionPipeline(
        vae=vae, text_encoder=text_encoder, tokenizer=tokenizer, unet=unet,
        scheduler=scheduler, safety_checker=None, requires_safety_checker=False,
        feature_extractor=None, image_encoder=None
    )
    i2i_pipe = StableDiffusionImg2ImgPipeline(
        vae=vae, text_encoder=text_encoder, tokenizer=tokenizer, unet=unet,
        scheduler=scheduler, safety_checker=None, requires_safety_checker=False,
        feature_extractor=None, image_encoder=None
    )
    
    _iclight_pipeline = {
        't2i_pipe': t2i_pipe,
        'i2i_pipe': i2i_pipe,
        'vae': vae,
        'device': device,
        'dtype': dtype
    }
    print(f"✅ [IC-Light AI] Tüm yapay zeka difüzyon modeli başarıyla hazırlandı!")
    return _iclight_pipeline

def rgb_to_color_name(r: int, g: int, b: int) -> str:
    import colorsys
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    if s < 0.15:
        if v > 0.85: return "bright neutral white light"
        elif v < 0.2: return "dark moody shadow"
        else: return "soft neutral studio light"
    deg = h * 360.0
    if deg < 15 or deg >= 345: hue = "vibrant crimson red"
    elif deg < 40: hue = "warm glowing orange amber"
    elif deg < 70: hue = "bright golden yellow"
    elif deg < 155: hue = "vivid emerald green"
    elif deg < 195: hue = "bright cyan aqua turquoise"
    elif deg < 265: hue = "deep electric cobalt blue"
    elif deg < 315: hue = "vivid neon purple violet"
    else: hue = "bright hot magenta pink"
    return f"intense {hue} light and colored highlights"

def run_iclight_ai_diffusion(input_rgba_pil, prompt, lx=-1.0, ly=0.0, lz=0.5, color_rgb=(255, 255, 255), intensity=1.0, ambient=0.35, seed=12345, steps=15, cfg_scale=3.0):
    import torch
    models = get_iclight_ai_models()
    t2i_pipe = models['t2i_pipe']
    i2i_pipe = models['i2i_pipe']
    vae = models['vae']
    device = models['device']
    dtype = models['dtype']
    
    orig_w, orig_h = input_rgba_pil.size
    target_w = max(256, min(768, (orig_w // 64) * 64))
    target_h = max(256, min(768, (orig_h // 64) * 64))
    
    img_resized = input_rgba_pil.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Neutral background paste for foreground conditioning
    bg = Image.new('RGB', (target_w, target_h), (127, 127, 127))
    if img_resized.mode == 'RGBA':
        bg.paste(img_resized, mask=img_resized.split()[3])
    else:
        bg.paste(img_resized)
        
    input_fg = np.array(bg).astype(np.float32) / 127.5 - 1.0
    input_fg = np.transpose(input_fg, (2, 0, 1))
    input_fg = torch.from_numpy(input_fg).unsqueeze(0).to(device, dtype=dtype)
    
    # Deterministic Generator
    use_seed = int(seed) if seed is not None and int(seed) >= 0 else 12345
    rng = torch.Generator(device=device).manual_seed(use_seed)
    
    with torch.inference_mode():
        c_concat = vae.encode(input_fg).latent_dist.mode() * vae.config.scaling_factor
        
        # Continuous Directional & Colored Initial Latent Gradient Map
        if lx is not None and ly is not None:
            x = np.linspace(-1.0, 1.0, target_w)
            y = np.linspace(-1.0, 1.0, target_h)
            xx, yy = np.meshgrid(x, y)
            
            if lz is not None and lz < 0:
                # Backlight / Rim Lighting Map: High at edges facing light direction, low at center
                dist_center = np.sqrt(xx**2 + yy**2)
                dir_align = np.clip((xx * lx + yy * ly) * 0.5 + 0.5, 0.15, 1.0)
                norm_grad = np.clip(dist_center * 1.3 * dir_align, 0.0, 1.0)
            else:
                # Front Lighting Map
                norm_grad = np.clip((xx * lx + yy * ly) * 0.5 + 0.5, 0.0, 1.0)
            
            cr, cg, cb = color_rgb[0] / 255.0, color_rgb[1] / 255.0, color_rgb[2] / 255.0
            bg_r = np.clip((ambient * 0.45 + (1.0 - ambient) * norm_grad * intensity * cr) * 255.0, 0, 255)
            bg_g = np.clip((ambient * 0.45 + (1.0 - ambient) * norm_grad * intensity * cg) * 255.0, 0, 255)
            bg_b = np.clip((ambient * 0.45 + (1.0 - ambient) * norm_grad * intensity * cb) * 255.0, 0, 255)
            input_bg = np.dstack([bg_r, bg_g, bg_b]).astype(np.uint8)
            
            bg_tensor = torch.from_numpy(input_bg.astype(np.float32) / 127.5 - 1.0).permute(2, 0, 1).unsqueeze(0).to(device, dtype=dtype)
            bg_latents = vae.encode(bg_tensor).latent_dist.mode() * vae.config.scaling_factor
            
            res = i2i_pipe(
                image=bg_latents,
                strength=0.92,
                prompt=prompt,
                negative_prompt="bad quality, blurry, noisy, lowres, deformed, artifact, pixelated",
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                generator=rng,
                cross_attention_kwargs={'concat_conds': c_concat},
                width=target_w,
                height=target_h
            ).images[0]
        else:
            res = t2i_pipe(
                prompt=prompt,
                negative_prompt="bad quality, blurry, noisy, lowres, deformed, artifact, pixelated",
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                generator=rng,
                cross_attention_kwargs={'concat_conds': c_concat},
                width=target_w,
                height=target_h
            ).images[0]
        
        out_pil = res.resize((orig_w, orig_h), Image.Resampling.LANCZOS)
        if input_rgba_pil.mode == 'RGBA':
            out_pil.putalpha(input_rgba_pil.split()[3])
            
        return out_pil

@app.post("/api/relight")
async def relight_image(
    file: UploadFile = File(...),
    light_direction: str = Form("left"),       # left, right, top, bottom, top_left, top_right, bottom_left, bottom_right, center, rim
    light_color: str = Form("#ffffff"),         # hex color string e.g. #ffaa44
    intensity: float = Form(1.0),              # 0.0 to 2.0
    temperature: float = Form(0.0),            # -1.0 (cool blue) to 1.0 (warm amber)
    ambient_level: float = Form(0.35),         # 0.0 to 1.0 ambient base light
    prompt_preset: str = Form("custom"),       # custom, golden_hour, cyberpunk, studio, moonlight, rim_light, dramatic, sunset
    engine: str = Form("auto"),                # auto / fast / ai
    light_x: float = Form(None),               # continuous -1.0 to 1.0
    light_y: float = Form(None),               # continuous -1.0 to 1.0
    light_z: float = Form(None),               # continuous 0.0 to 1.0
    seed: int = Form(12345)                    # fixed seed for deterministic reproducibility
):
    start_t = time.time()
    file_name = file.filename or "image.png"
    
    # Safe parameter normalization
    try:
        intensity_val = float(intensity)
    except Exception:
        intensity_val = 1.0
    try:
        temp_val = float(temperature)
    except Exception:
        temp_val = 0.0
    try:
        ambient_val = float(ambient_level)
    except Exception:
        ambient_val = 0.35
    try:
        seed_val = int(seed)
    except Exception:
        seed_val = 12345
    dir_val = str(light_direction) if isinstance(light_direction, str) else "left"
    preset_val = str(prompt_preset) if isinstance(prompt_preset, str) else "custom"
    color_val = str(light_color) if isinstance(light_color, str) else "#ffffff"
    engine_val = str(engine) if isinstance(engine, str) else "fast"
    
    # Continuous 3D Sphere vector handling
    vec_lx = None
    vec_ly = None
    vec_lz = None
    if light_x is not None and light_y is not None:
        try:
            vec_lx = float(light_x)
            vec_ly = float(light_y)
            vec_lz = float(light_z) if light_z is not None else np.sqrt(max(0.0, 1.0 - vec_lx**2 - vec_ly**2))
        except Exception:
            pass

    print(f"\n💡 [Relight & Atmosphere] İşlem Başlatıldı: '{file_name}'")
    print(f"   ⚙️  Ayarlar: Yön={dir_val.upper()} | 3D Vektör=({vec_lx}, {vec_ly}) | Preset={preset_val.upper()} | Motor={engine_val.upper()} | Şiddet=%{int(intensity_val*100)} | Renk={color_val}")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGBA")
        np_img = np.array(image, dtype=np.float32) / 255.0
        
        rgb = np_img[:, :, :3]
        alpha = np_img[:, :, 3:4]
        
        # If no alpha or completely opaque, check transparency
        has_transparency = np.mean(alpha < 0.95) > 0.01
        print(f"   📐 Çözünürlük: {image.width}x{image.height} | Şeffaf Alfa Maskesi: {'Evet' if has_transparency else 'Hayır'}")
        
        # 1. Light Color & Temperature Handling
        key_color = np.array(hex_to_rgb(color_val), dtype=np.float32) / 255.0
        
        # Preset overrides
        fill_color = np.array([1.0, 1.0, 1.0], dtype=np.float32)
        rim_enabled = False
        rim_color = key_color
        
        if preset_val == "golden_hour":
            key_color = np.array([1.0, 0.72, 0.35], dtype=np.float32) # warm golden sun
            fill_color = np.array([0.55, 0.45, 0.65], dtype=np.float32) # soft sky purple
            temp_val = 0.5
        elif preset_val == "cyberpunk":
            key_color = np.array([0.05, 0.85, 1.0], dtype=np.float32) # neon cyan
            fill_color = np.array([0.95, 0.1, 0.6], dtype=np.float32) # neon magenta
            rim_enabled = True
            rim_color = fill_color
        elif preset_val == "studio":
            key_color = np.array([1.0, 0.98, 0.95], dtype=np.float32)
            fill_color = np.array([0.85, 0.90, 0.95], dtype=np.float32)
        elif preset_val == "moonlight":
            key_color = np.array([0.45, 0.7, 1.0], dtype=np.float32)
            fill_color = np.array([0.15, 0.25, 0.45], dtype=np.float32)
            temp_val = -0.4
        elif preset_val == "rim_light":
            rim_enabled = True
            rim_color = key_color
            dir_val = "rim"
        elif preset_val == "sunset":
            key_color = np.array([1.0, 0.4, 0.2], dtype=np.float32)
            fill_color = np.array([0.3, 0.15, 0.4], dtype=np.float32)
        elif preset_val == "dramatic":
            intensity_val = max(intensity_val, 1.4)
            ambient_val = min(ambient_val, 0.18)

        # Apply Kelvin/temperature bias if custom
        if temp_val > 0: # warm
            key_color = key_color * np.array([1.0 + temp_val * 0.35, 1.0, 1.0 - temp_val * 0.35])
        elif temp_val < 0: # cool
            t = abs(temp_val)
            key_color = key_color * np.array([1.0 - t * 0.35, 1.0, 1.0 + t * 0.4])
        key_color = np.clip(key_color, 0.0, 1.5)

        # 2. Pseudo-Normal Estimation (from Grayscale Luminance + Alpha Boundary)
        gray = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        
        # Smooth with PIL Gaussian Blur for natural lighting gradients
        gray_pil = Image.fromarray((gray * 255.0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2))
        gray_blur = np.array(gray_pil, dtype=np.float32) / 255.0
        
        # Gradients (dY, dX)
        gy, gx = np.gradient(gray_blur)
        
        # If alpha exists, also calculate alpha silhouette boundary gradients
        if has_transparency:
            alpha_pil = Image.fromarray((alpha[:, :, 0] * 255.0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=3))
            alpha_blur = np.array(alpha_pil, dtype=np.float32) / 255.0
            alpha_gy, alpha_gx = np.gradient(alpha_blur)
            gx = gx * 0.5 + alpha_gx * 1.5
            gy = gy * 0.5 + alpha_gy * 1.5

        # Normal vector components Nx, Ny, Nz
        nx = -gx * 3.5
        ny = -gy * 3.5
        nz = np.ones_like(gray, dtype=np.float32) * 0.8
        
        norm = np.sqrt(nx*nx + ny*ny + nz*nz) + 1e-6
        nx = nx / norm
        ny = ny / norm
        nz = nz / norm
        
        # 3. Direction Light Vector (Lx, Ly, Lz)
        if vec_lx is not None and vec_ly is not None:
            lx, ly, lz = vec_lx, vec_ly, vec_lz
        else:
            dir_map = {
                "left": (-1.0, 0.0, 0.45),
                "right": (1.0, 0.0, 0.45),
                "top": (0.0, -1.0, 0.45),
                "bottom": (0.0, 1.0, 0.45),
                "top_left": (-0.8, -0.8, 0.45),
                "top_right": (0.8, -0.8, 0.45),
                "bottom_left": (-0.8, 0.8, 0.45),
                "bottom_right": (0.8, 0.8, 0.45),
                "center": (0.0, 0.0, 1.0),
                "rim": (0.0, 0.0, -0.9)
            }
            lx, ly, lz = dir_map.get(dir_val, (1.0, 0.0, 0.5))
        
        l_norm = np.sqrt(lx*lx + ly*ly + lz*lz) + 1e-6
        lx, ly, lz = lx / l_norm, ly / l_norm, lz / l_norm
        
        # 4. Dot Product (N . L) Diffuse Shading + Spatial Lighting Sweep
        dot = nx * lx + ny * ly + nz * lz
        diffuse = np.clip(dot, 0.0, 1.0)
        diffuse_smooth = np.power((dot * 0.5 + 0.5), 1.6)

        # Spatial 2D directional coordinate ramp across object canvas
        grid_y, grid_x = np.mgrid[-1.0:1.0:complex(0, image.height), -1.0:1.0:complex(0, image.width)].astype(np.float32)
        spatial_grad = np.clip((grid_x * lx + grid_y * ly) * 0.8 + 0.5, 0.05, 1.0)
        combined_diffuse = diffuse_smooth * 0.4 + spatial_grad * 0.6
        
        # Specular Highlight
        view_z = 1.0
        hx = lx
        hy = ly
        hz = lz + view_z
        h_norm = np.sqrt(hx*hx + hy*hy + hz*hz) + 1e-6
        hx, hy, hz = hx / h_norm, hy / h_norm, hz / h_norm
        n_dot_h = np.clip(nx * hx + ny * hy + nz * hz, 0.0, 1.0)
        specular = np.power(n_dot_h, 24.0) * 0.45 * intensity_val

        # Rim light calculation
        rim_factor = np.power(np.clip(1.0 - nz, 0.0, 1.0), 2.2)
        if lz < 0:
            # Backlight directional rim glow
            dir_align = np.clip(nx * lx + ny * ly, 0.0, 1.0) * 0.75 + 0.25
            rim_term = rim_factor[:, :, np.newaxis] * key_color * (dir_align[:, :, np.newaxis] * abs(lz) * 2.8 * intensity_val)
        elif dir_val == "rim" or rim_enabled:
            rim_term = rim_factor[:, :, np.newaxis] * rim_color * (1.2 * intensity_val)
        else:
            rim_term = np.zeros_like(rgb)

        # 5. Composite Light Map / AI Diffusion Execution
        if engine_val == "ai" and is_model_installed("iclight"):
            try:
                print(f"   🧠 [IC-Light AI] Tam Üretici Difüzyon Sinir Ağı Çalıştırılıyor (CUDA FP16 - 15 Adım)...")
                if vec_lx is not None and vec_ly is not None:
                    deg = int(np.round(np.arctan2(vec_ly, vec_lx) * 180 / np.pi))
                    horiz = "left" if vec_lx < -0.25 else ("right" if vec_lx > 0.25 else "")
                    vert = "top" if vec_ly < -0.25 else ("bottom" if vec_ly > 0.25 else "")
                    pos_label = f"{vert} {horiz}".strip() or "center"
                    if lz < -0.2:
                        dir_desc = f"dramatic backlit rim lighting from behind {pos_label} ({deg} degrees), glowing silhouette edge separation and edge highlights"
                    else:
                        dir_desc = f"light source placed in front {pos_label} ({deg} degrees angle), clear directional highlights"
                else:
                    dir_desc = {
                        "left": "light source on the left side, strong lighting from the left, bright left highlights",
                        "right": "light source on the right side, strong lighting from the right, bright right highlights",
                        "top": "top-down illumination from above, bright highlights on top edges",
                        "bottom": "under-lighting from below, glowing from bottom",
                        "top_left": "light source from top left, strong top-left illumination",
                        "top_right": "light source from top right, strong top-right illumination",
                        "bottom_left": "light source from bottom left",
                        "bottom_right": "light source from bottom right",
                        "center": "front lighting, direct studio softbox from center",
                        "rim": "backlit rim lighting, luminous silhouette edge separation"
                    }.get(dir_val, f"lighting from {dir_val}")
                
                r_int, g_int, b_int = hex_to_rgb(color_val)
                color_name_desc = rgb_to_color_name(r_int, g_int, b_int)
                
                preset_desc = {
                    "golden_hour": "golden hour warm sunset sunlight, warm amber atmosphere",
                    "cyberpunk": "cyberpunk neon lights, vibrant cyan and magenta glowing highlights",
                    "studio": "professional photography softbox studio lighting, neutral clean balanced",
                    "moonlight": "mysterious moonlight, night sky deep blue illumination",
                    "rim_light": "strong cinematic rim light edge separation",
                    "dramatic": "high contrast dramatic chiaroscuro cinema lighting",
                    "sunset": "fiery sunset ambient glow"
                }.get(preset_val, color_name_desc)
                
                ai_prompt = f"{dir_desc}, {preset_desc}, {color_name_desc}, high quality, sharp focus, 8k, photorealistic"
                out_img = run_iclight_ai_diffusion(
                    image,
                    ai_prompt,
                    lx=lx,
                    ly=ly,
                    lz=lz,
                    color_rgb=(r_int, g_int, b_int),
                    intensity=intensity_val,
                    ambient=ambient_val,
                    seed=seed_val,
                    steps=15,
                    cfg_scale=max(2.0, min(5.0, 1.8 + intensity_val * 1.2))
                )
            except Exception as ai_err:
                print(f"   ⚠️ [IC-Light AI Fallback to Shader] {ai_err}")
                shadow_mult = np.clip((ambient_val * 0.5 + 0.2) + (1.0 - ambient_val * 0.5) * combined_diffuse, 0.15, 1.0)[:, :, np.newaxis]
                shaded_base = rgb * shadow_mult
                key_light_term = (shaded_base * key_color * (combined_diffuse[:, :, np.newaxis] * 1.6) + specular[:, :, np.newaxis] * key_color) * intensity_val
                relit_rgb = np.clip(shaded_base * (ambient_val * 0.7 + 0.3) + key_light_term + rim_term, 0.0, 1.0)
                output_arr = np.dstack([relit_rgb, alpha])
                output_arr = (output_arr * 255.0).astype(np.uint8)
                out_img = Image.fromarray(output_arr, mode="RGBA")
        else:
            shadow_mult = np.clip((ambient_val * 0.5 + 0.2) + (1.0 - ambient_val * 0.5) * combined_diffuse, 0.15, 1.0)[:, :, np.newaxis]
            shaded_base = rgb * shadow_mult
            key_light_term = (shaded_base * key_color * (combined_diffuse[:, :, np.newaxis] * 1.6) + specular[:, :, np.newaxis] * key_color) * intensity_val
            relit_rgb = np.clip(shaded_base * (ambient_val * 0.7 + 0.3) + key_light_term + rim_term, 0.0, 1.0)
            output_arr = np.dstack([relit_rgb, alpha])
            output_arr = (output_arr * 255.0).astype(np.uint8)
            out_img = Image.fromarray(output_arr, mode="RGBA")
        
        buf = io.BytesIO()
        out_img.save(buf, format='PNG')
        buf.seek(0)
        
        elapsed = time.time() - start_t
        print(f"   ✨ Işık & Atmosfer Hesaplandı: {elapsed:.2f} saniye (Motor: {engine_val.upper()})")
        print(f"✅ [Relight] Başarıyla tamamlandı!\n")
        
        return Response(content=buf.read(), media_type="image/png")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ [Relight] Hata: {e}\n")
        return JSONResponse(status_code=500, content={"error": str(e)})

# =========================================================================
# 3. AUTO SAVE (Diske Kayıt)
# =========================================================================

class SaveAssetItem(BaseModel):
    name: str
    label: Optional[str] = ""
    data: str

class SaveAssetsRequest(BaseModel):
    assets: List[SaveAssetItem]
    output_dir: Optional[str] = ""
    source_filename: Optional[str] = ""
    source_folder: Optional[str] = ""
    create_subfolder: Optional[bool] = True

def open_native_folder_dialog(title="Klasör Seçin"):
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        folder = filedialog.askdirectory(title=title)
        root.destroy()
        return folder
    except Exception as e:
        print("Folder dialog error:", e)
        return ""

def open_native_file_dialog(title="Resim Dosyası Seçin"):
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        file_path = filedialog.askopenfilename(
            title=title,
            filetypes=[("Görsel Dosyaları", "*.png;*.jpg;*.jpeg;*.webp;*.bmp"), ("Tüm Dosyalar", "*.*")]
        )
        root.destroy()
        return file_path
    except Exception as e:
        print("File dialog error:", e)
        return ""

@app.post("/api/dialog/select-file")
def select_file_dialog():
    file_path = open_native_file_dialog("Resim Dosyası Seçin")
    if not file_path:
        return {"cancelled": True, "path": "", "name": "", "data": "", "dir": ""}
    
    try:
        ext = os.path.splitext(file_path)[1].lower()
        with open(file_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        mime = "image/png" if ext == ".png" else "image/jpeg"
        data_url = f"data:{mime};base64,{b64}"
        return {
            "cancelled": False,
            "path": os.path.abspath(file_path),
            "dir": os.path.abspath(os.path.dirname(file_path)),
            "name": os.path.basename(file_path),
            "data": data_url
        }
    except Exception as e:
        return {"cancelled": True, "error": str(e)}

@app.post("/api/dialog/select-folder")
def select_folder_dialog():
    folder_path = open_native_folder_dialog("Klasör Seçin")
    if not folder_path:
        return {"cancelled": True, "path": "", "files": []}
    
    valid_exts = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
    files_list = []
    try:
        for f in os.listdir(folder_path):
            ext = os.path.splitext(f)[1].lower()
            if ext in valid_exts:
                abs_path = os.path.join(folder_path, f)
                if os.path.isfile(abs_path):
                    try:
                        with open(abs_path, "rb") as img_f:
                            b64 = base64.b64encode(img_f.read()).decode("utf-8")
                            mime = "image/png" if ext == ".png" else "image/jpeg"
                            data_url = f"data:{mime};base64,{b64}"
                            files_list.append({
                                "name": f,
                                "path": abs_path,
                                "data": data_url
                            })
                    except Exception:
                        pass
    except Exception as e:
        print("Scan folder error:", e)

    return {
        "cancelled": False,
        "path": os.path.abspath(folder_path),
        "count": len(files_list),
        "files": files_list
    }

class OpenFolderRequest(BaseModel):
    path: str

@app.post("/api/open-folder")
def open_folder_in_explorer(req_data: OpenFolderRequest):
    folder = req_data.path.strip()
    if folder and os.path.exists(folder):
        try:
            if os.name == 'nt':
                os.startfile(folder)
            else:
                import subprocess
                subprocess.Popen(['xdg-open', folder])
            return {"status": "success", "opened": folder}
        except Exception as e:
            return {"error": str(e)}
    return {"error": f"Folder not found: {folder}"}

@app.post("/api/save-assets")
def save_assets_to_disk(req: SaveAssetsRequest):
    try:
        user_dir = req.output_dir.strip() if req.output_dir else ""
        
        # 1. Custom directory explicitly specified by user
        if user_dir and user_dir.lower() != "auto":
            if os.path.isabs(user_dir):
                base_dir = user_dir
            else:
                base_dir = os.path.join(BASE_DIR, user_dir)
        # 2. Automatic mode: save into the exact source folder on user's disk!
        else:
            if req.source_folder:
                if os.path.isabs(req.source_folder):
                    # Save right next to or inside the source folder!
                    base_dir = os.path.join(req.source_folder, "output_assets")
                else:
                    base_dir = os.path.join(BASE_DIR, "output", req.source_folder)
            else:
                base_dir = os.path.join(BASE_DIR, "output", "assets")
            
        if req.create_subfolder and req.source_filename:
            folder_name = os.path.splitext(os.path.basename(req.source_filename))[0]
            target_dir = os.path.join(base_dir, folder_name)
        else:
            target_dir = base_dir
            
        os.makedirs(target_dir, exist_ok=True)
        saved_files = []
        
        for item in req.assets:
            raw_b64 = item.data
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
                
            img_bytes = base64.b64decode(raw_b64)
            file_path = os.path.join(target_dir, item.name)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(img_bytes)
            saved_files.append(file_path)
            
        return {
            "status": "success",
            "saved_count": len(saved_files),
            "target_dir": os.path.abspath(target_dir),
            "files": saved_files
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

class ExportZipRequest(BaseModel):
    folder_name: str
    assets: List[SaveAssetItem]
    save_to_disk: Optional[bool] = True

@app.post("/api/export-sequence-zip")
def export_sequence_zip(req: ExportZipRequest):
    try:
        import zipfile
        clean_folder = req.folder_name.strip() or "sequence"
        clean_folder = "".join([c if c.isalnum() or c in "-_" else "_" for c in clean_folder])
        
        disk_target = os.path.join(BASE_DIR, "output", "assets", clean_folder)
        if req.save_to_disk:
            os.makedirs(disk_target, exist_ok=True)
            
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for item in req.assets:
                raw_b64 = item.data
                if "," in raw_b64:
                    raw_b64 = raw_b64.split(",", 1)[1]
                img_bytes = base64.b64decode(raw_b64)
                
                filename = os.path.basename(item.name)
                arcname = f"{clean_folder}/{filename}"
                zf.writestr(arcname, img_bytes)
                
                if req.save_to_disk:
                    with open(os.path.join(disk_target, filename), "wb") as df:
                        df.write(img_bytes)
                        
        zip_buffer.seek(0)
        from fastapi.responses import Response
        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{clean_folder}_sequence.zip"',
                "X-Target-Dir": os.path.abspath(disk_target)
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# =========================================================================
# 4. AGENTS HOOK
# =========================================================================
@app.get("/api/agents/status")
def get_agents_status():
    return {"status": "ready", "agents": []}

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 NodeAgent Studio Server Başlatılıyor...")
    print("🌐 Arayüz: http://127.0.0.1:8000")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=8000)
