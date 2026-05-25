# -*- coding: UTF-8 -*-
import os
import json
from . import util
from modules import shared


root_path = os.getcwd()
util.printD(f"Root Path is: {root_path}")

if root_path.startswith("~/"):
    user_home = os.path.expanduser("~")
    util.printD(f"Root Path is under User Home: {user_home}")
    root_path = os.path.join(user_home, root_path[2:])
    util.printD(f"Expanded Root Path is: {root_path}")


folders = {
    "ti": os.path.join(root_path, "embeddings"),
    "hyper": os.path.join(root_path, "models", "hypernetworks"),
    "ckp": os.path.join(root_path, "models", "Stable-diffusion"),
    "lora": os.path.join(root_path, "models", "Lora"),
    "controlnet": os.path.join(root_path, "models", "Controlnet"),
    "vae": os.path.join(root_path, "models", "VAE"),
    "upscaler": os.path.join(root_path, "models", "ESRGAN"),
}

exts = (".bin", ".pt", ".safetensors", ".ckpt", ".pth")
info_ext = ".info"
vae_suffix = ".vae"

model_type_display = {
    "ti": "Textual Inversion",
    "hyper": "Hypernetwork",
    "ckp": "Checkpoint",
    "lora": "LoRA",
    "controlnet": "ControlNet",
    "vae": "VAE",
    "upscaler": "Upscaler",
}


def get_custom_model_folder():
    util.printD("Get Custom Model Folder")

    global folders

    try:
        if hasattr(shared.cmd_opts, 'embeddings_dir') and shared.cmd_opts.embeddings_dir and os.path.isdir(shared.cmd_opts.embeddings_dir):
            folders["ti"] = shared.cmd_opts.embeddings_dir

        if hasattr(shared.cmd_opts, 'hypernetwork_dir') and shared.cmd_opts.hypernetwork_dir and os.path.isdir(shared.cmd_opts.hypernetwork_dir):
            folders["hyper"] = shared.cmd_opts.hypernetwork_dir

        if hasattr(shared.cmd_opts, 'ckpt_dir') and shared.cmd_opts.ckpt_dir and os.path.isdir(shared.cmd_opts.ckpt_dir):
            folders["ckp"] = shared.cmd_opts.ckpt_dir

        if hasattr(shared.cmd_opts, 'lora_dir') and shared.cmd_opts.lora_dir and os.path.isdir(shared.cmd_opts.lora_dir):
            folders["lora"] = shared.cmd_opts.lora_dir

        if hasattr(shared.cmd_opts, 'controlnet_dir') and shared.cmd_opts.controlnet_dir and os.path.isdir(shared.cmd_opts.controlnet_dir):
            folders["controlnet"] = shared.cmd_opts.controlnet_dir

        if hasattr(shared.cmd_opts, 'vae_dir') and shared.cmd_opts.vae_dir and os.path.isdir(shared.cmd_opts.vae_dir):
            folders["vae"] = shared.cmd_opts.vae_dir

        if hasattr(shared.cmd_opts, 'esrgan_dir') and shared.cmd_opts.esrgan_dir and os.path.isdir(shared.cmd_opts.esrgan_dir):
            folders["upscaler"] = shared.cmd_opts.esrgan_dir

        if hasattr(shared.cmd_opts, 'upscale_models_dir') and shared.cmd_opts.upscale_models_dir and os.path.isdir(shared.cmd_opts.upscale_models_dir):
            folders["upscaler"] = shared.cmd_opts.upscale_models_dir
    except Exception as e:
        util.printD(f"Error loading custom model folders: {str(e)}")

    existing_folders = {}
    for key, path in folders.items():
        if os.path.isdir(path):
            existing_folders[key] = path
        else:
            util.printD(f"Model folder does not exist, skipping: {key} -> {path}")
    folders = existing_folders


def write_model_info(path, model_info):
    util.printD("Write model info to file: " + path)
    with open(os.path.realpath(path), 'w') as f:
        f.write(json.dumps(model_info, indent=4))


def load_model_info(path):
    model_info = None
    with open(os.path.realpath(path), 'r') as f:
        try:
            model_info = json.load(f)
        except Exception as e:
            util.printD("Selected file is not json: " + path)
            util.printD(e)
            return
        
    return model_info


def get_model_names_by_type(model_type:str) -> list:
    
    model_folder = folders[model_type]

    model_names = []
    for root, dirs, files in os.walk(model_folder, followlinks=True):
        for filename in files:
            item = os.path.join(root, filename)
            base, ext = os.path.splitext(item)
            if ext in exts:
                model_names.append(filename)

    return model_names


def get_model_path_by_type_and_name(model_type:str, model_name:str) -> str:
    util.printD("Run get_model_path_by_type_and_name")
    if model_type not in folders.keys():
        util.printD("unknown model_type: " + model_type)
        return
    
    if not model_name:
        util.printD("model name can not be empty")
        return
    
    folder = folders[model_type]

    model_root = ""
    model_path = ""
    for root, dirs, files in os.walk(folder, followlinks=True):
        for filename in files:
            if filename == model_name:
                model_root = root
                model_path = os.path.join(root, filename)
                return (model_root, model_path)

    return




def get_model_path_by_search_term(model_type:str, search_term:str):
    util.printD(f"Search model of {search_term} in {model_type}")
    if model_type not in folders.keys():
        util.printD("unknow model type: " + model_type)
        return
    
    has_hash = True
    if model_type == "hyper":
        has_hash = False
    elif search_term.endswith(".pt") or search_term.endswith(".bin") or search_term.endswith(".safetensors") or search_term.endswith(".ckpt") or search_term.endswith(".pth"):
        has_hash = False

    splited_path = search_term.split()
    model_sub_path = splited_path[0]
    if has_hash and len(splited_path) > 1:
        model_sub_path = ""
        for i in range(0, len(splited_path)-1):
            model_sub_path += splited_path[i] + " "
        
        model_sub_path = model_sub_path.strip()

    if model_sub_path[:1] == "/":
        model_sub_path = model_sub_path[1:]

    model_folder_name = "";
    if model_type == "ti":
        model_folder_name = "embeddings"
    elif model_type == "hyper":
        model_folder_name = "hypernetworks"
    elif model_type == "ckp":
        model_folder_name = "Stable-diffussion"
    elif model_type == "controlnet":
        model_folder_name = "Controlnet"
    elif model_type == "vae":
        model_folder_name = "VAE"
    elif model_type == "upscaler":
        model_folder_name = "ESRGAN"
    else:
        model_folder_name = "Lora"

    if model_sub_path.startswith(model_folder_name):
        model_sub_path = model_sub_path[len(model_folder_name):]

        if model_sub_path.startswith("/") or model_sub_path.startswith("\\"):
            model_sub_path = model_sub_path[1:]

    if model_type == "hyper":
        if not model_sub_path.endswith(".pt"):
            model_sub_path = model_sub_path+".pt"

    model_folder = folders[model_type]

    model_path = os.path.join(model_folder, model_sub_path)

    print("model_folder: " + model_folder)
    print("model_sub_path: " + model_sub_path)
    print("model_path: " + model_path)

    if not os.path.isfile(model_path):
        util.printD("Can not find model file: " + model_path)
        return
    
    return model_path


def has_info_and_preview(model_path:str) -> bool:
    if not model_path or not os.path.isfile(model_path):
        return False

    base, ext = os.path.splitext(model_path)
    info_file = base + ".civitai" + info_ext
    first_preview = base + ".png"
    sec_preview = base + ".preview.png"

    has_info = os.path.isfile(info_file)
    has_preview = os.path.isfile(first_preview) or os.path.isfile(sec_preview)

    return has_info and has_preview
