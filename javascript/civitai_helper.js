"use strict";

function ch_convert_file_path_to_url(path){
    let prefix = "file=";
    let path_to_url = path.replaceAll('\\', '/');
    return prefix+path_to_url;
}

function ch_img_node_str(path){
    return `<img src='${ch_convert_file_path_to_url(path)}' style="width:24px"/>`;
}

function ch_sd_version() {
    let foot = gradioApp().getElementById("footer");
    if (!foot) { return null; }
    let versions = foot.querySelector(".versions");
    if (!versions) { return null; }
    let [webui_version] = versions.getElementsByTagName("a");
    if (!webui_version) { return null; }
    return extract_version(webui_version.innerHTML);
}

function extract_version(text) {
    if (!text) return null;
    let matches;
    if (text[0] == 'f')
        matches = text.match(/v\d+\.\d+\.\d+/);
    else
        matches = text.match(/\d+\.\d+\.\d+/);
    if (matches === null || matches.length == 0) { return null; }
    if (text[0] == 'f') return matches[0].substring(1);
    return matches[0];
}

function send_ch_py_msg(msg){
    let js_msg_txtbox = gradioApp().querySelector("#ch_js_msg_txtbox textarea");
    if (js_msg_txtbox && msg) {
        js_msg_txtbox.value = JSON.stringify(msg);
        js_msg_txtbox.dispatchEvent(new Event("input"));
    }
}

function get_ch_py_msg(){
    const py_msg_txtbox = gradioApp().querySelector("#ch_py_msg_txtbox textarea");
    if (py_msg_txtbox && py_msg_txtbox.value) {
        return py_msg_txtbox.value;
    }
    return "";
}

const get_new_ch_py_msg = (max_count=5) => new Promise((resolve, reject) => {
    let count = 0;
    let new_msg = "";
    let find_msg = false;
    const interval = setInterval(() => {
        const py_msg_txtbox = gradioApp().querySelector("#ch_py_msg_txtbox textarea");
        count++;
        if (py_msg_txtbox && py_msg_txtbox.value) {
            new_msg = py_msg_txtbox.value;
            if (new_msg != "") { find_msg = true; }
        }
        if (find_msg) {
            py_msg_txtbox.value = "";
            py_msg_txtbox.dispatchEvent(new Event("input"));
            resolve(new_msg);
            clearInterval(interval);
        } else if (count > max_count) {
            py_msg_txtbox.value = "";
            py_msg_txtbox.dispatchEvent(new Event("input"));
            reject('');
            clearInterval(interval);
        }
    }, 1000);
})

function getActiveTabType() {
    const currentTab = get_uiCurrentTabContent();
    if (!currentTab) return null;
    switch (currentTab.id) {
        case "tab_txt2img": return "txt2img";
        case "tab_img2img": return "img2img";
    }
    return null;
}

function getActivePrompt() {
    const currentTab = get_uiCurrentTabContent();
    if (!currentTab) return null;
    switch (currentTab.id) {
        case "tab_txt2img": return currentTab.querySelector("#txt2img_prompt textarea");
        case "tab_img2img": return currentTab.querySelector("#img2img_prompt textarea");
    }
    return null;
}

function getActiveNegativePrompt() {
    const currentTab = get_uiCurrentTabContent();
    if (!currentTab) return null;
    switch (currentTab.id) {
        case "tab_txt2img": return currentTab.querySelector("#txt2img_neg_prompt textarea");
        case "tab_img2img": return currentTab.querySelector("#img2img_neg_prompt textarea");
    }
    return null;
}

function convertModelTypeFromPyToJS(model_type) {
    switch (model_type) {
        case "ti": return "textual_inversion";
        case "hyper": return "hypernetworks";
        case "ckp": return "checkpoints";
        case "lora": return "lora";
    }
    return "";
}

function convertModelTypeFromJsToPy(js_model_type) {
    switch (js_model_type) {
        case "textual_inversion": return "ti";
        case "hypernetworks": return "hyper";
        case "checkpoints": return "ckp";
        case "lora": return "lora";
    }
    return "";
}

async function open_model_url(event, model_type, search_term){
    let js_open_url_btn = gradioApp().getElementById("ch_js_open_url_btn");
    if (!js_open_url_btn) { return; }

    let msg = {
        "action": "open_url",
        "model_type": model_type,
        "search_term": search_term,
        "prompt": "",
        "neg_prompt": "",
    }
    send_ch_py_msg(msg);
    js_open_url_btn.click();
    event.stopPropagation();
    event.preventDefault();

    let new_py_msg = "";
    try {
        new_py_msg = await get_new_ch_py_msg();
    } catch (error) {}

    if (new_py_msg) {
        try {
            let py_msg_json = JSON.parse(new_py_msg);
            if (py_msg_json && py_msg_json.content && py_msg_json.content.url) {
                window.open(py_msg_json.content.url, "_blank");
            }
        } catch(e) {}
    }
}

function add_trigger_words(event, model_type, search_term){
    let js_add_trigger_words_btn = gradioApp().getElementById("ch_js_add_trigger_words_btn");
    if (!js_add_trigger_words_btn) { return; }

    let msg = {
        "action": "add_trigger_words",
        "model_type": model_type,
        "search_term": search_term,
        "prompt": "",
        "neg_prompt": "",
    }
    let act_prompt = getActivePrompt();
    msg["prompt"] = act_prompt ? act_prompt.value : "";
    send_ch_py_msg(msg);
    js_add_trigger_words_btn.click();
    event.stopPropagation();
    event.preventDefault();
}

function use_preview_prompt(event, model_type, search_term){
    let js_use_preview_prompt_btn = gradioApp().getElementById("ch_js_use_preview_prompt_btn");
    if (!js_use_preview_prompt_btn) { return; }

    let msg = {
        "action": "use_preview_prompt",
        "model_type": model_type,
        "search_term": search_term,
        "prompt": "",
        "neg_prompt": "",
    }
    let act_prompt = getActivePrompt();
    msg["prompt"] = act_prompt ? act_prompt.value : "";
    let neg_prompt = getActiveNegativePrompt();
    msg["neg_prompt"] = neg_prompt ? neg_prompt.value : "";
    send_ch_py_msg(msg);
    js_use_preview_prompt_btn.click();
    event.stopPropagation();
    event.preventDefault();
}

async function remove_card(event, model_type, search_term){
    let js_remove_card_btn = gradioApp().getElementById("ch_js_remove_card_btn");
    if (!js_remove_card_btn) { return; }

    if (!confirm("\nConfirm to remove this model.\n\nCheck console log for detail.")) { return; }

    let msg = {
        "action": "remove_card",
        "model_type": model_type,
        "search_term": search_term,
        "prompt": "",
        "neg_prompt": "",
    }
    send_ch_py_msg(msg);
    js_remove_card_btn.click();
    event.stopPropagation();
    event.preventDefault();

    let new_py_msg = "";
    try {
        new_py_msg = await get_new_ch_py_msg();
    } catch (error) {
        new_py_msg = error;
    }

    let result = "Done";
    if (new_py_msg) { result = new_py_msg; }
    alert(result);

    if (result=="Done"){
        let active_tab = getActiveTabType();
        if (active_tab){
            let js_model_type = convertModelTypeFromPyToJS(model_type);
            if (!js_model_type){return;}
            let refresh_btn_id = active_tab + "_" + js_model_type + "_extra_refresh";
            let refresh_btn = gradioApp().getElementById(refresh_btn_id);
            if (refresh_btn){ refresh_btn.click(); }
        }
    }
}

async function open_model_url_with_path(event, model_type, model_path){
    let js_open_url_btn = gradioApp().getElementById("ch_js_open_url_btn");
    if (!js_open_url_btn) { return; }

    let msg = {
        "action": "open_url",
        "model_type": model_type,
        "model_path": model_path,
        "prompt": "",
        "neg_prompt": "",
    }
    send_ch_py_msg(msg);
    js_open_url_btn.click();
    event.stopPropagation();
    event.preventDefault();

    let new_py_msg = "";
    try {
        new_py_msg = await get_new_ch_py_msg();
    } catch (error) {}

    if (new_py_msg) {
        try {
            let py_msg_json = JSON.parse(new_py_msg);
            if (py_msg_json && py_msg_json.content && py_msg_json.content.url) {
                window.open(py_msg_json.content.url, "_blank");
            }
        } catch(e) {}
    }
}

function add_trigger_words_with_path(event, model_type, model_path){
    let js_add_trigger_words_btn = gradioApp().getElementById("ch_js_add_trigger_words_btn");
    if (!js_add_trigger_words_btn) { return; }

    let msg = {
        "action": "add_trigger_words",
        "model_type": model_type,
        "model_path": model_path,
        "prompt": "",
        "neg_prompt": "",
    }
    let act_prompt = getActivePrompt();
    msg["prompt"] = act_prompt ? act_prompt.value : "";
    send_ch_py_msg(msg);
    js_add_trigger_words_btn.click();
    event.stopPropagation();
    event.preventDefault();
}

function use_preview_prompt_with_path(event, model_type, model_path){
    let js_use_preview_prompt_btn = gradioApp().getElementById("ch_js_use_preview_prompt_btn");
    if (!js_use_preview_prompt_btn) { return; }

    let msg = {
        "action": "use_preview_prompt",
        "model_type": model_type,
        "model_path": model_path,
        "prompt": "",
        "neg_prompt": "",
    }
    let act_prompt = getActivePrompt();
    msg["prompt"] = act_prompt ? act_prompt.value : "";
    let neg_prompt = getActiveNegativePrompt();
    msg["neg_prompt"] = neg_prompt ? neg_prompt.value : "";
    send_ch_py_msg(msg);
    js_use_preview_prompt_btn.click();
    event.stopPropagation();
    event.preventDefault();
}

async function remove_card_with_path(event, model_type, model_path){
    let js_remove_card_btn = gradioApp().getElementById("ch_js_remove_card_btn");
    if (!js_remove_card_btn) { return; }

    if (!confirm("\nConfirm to remove this model.\n\nCheck console log for detail.")) { return; }

    let msg = {
        "action": "remove_card",
        "model_type": model_type,
        "model_path": model_path,
        "prompt": "",
        "neg_prompt": "",
    }
    send_ch_py_msg(msg);
    js_remove_card_btn.click();
    event.stopPropagation();
    event.preventDefault();

    let new_py_msg = "";
    try {
        new_py_msg = await get_new_ch_py_msg();
    } catch (error) {
        new_py_msg = error;
    }

    let result = "Done";
    if (new_py_msg) { result = new_py_msg; }
    alert(result);

    if (result=="Done"){
        let active_tab = getActiveTabType();
        if (active_tab){
            let js_model_type = convertModelTypeFromPyToJS(model_type);
            if (!js_model_type){return;}
            let refresh_btn_id = active_tab + "_" + js_model_type + "_extra_refresh";
            let refresh_btn = gradioApp().getElementById(refresh_btn_id);
            if (refresh_btn){ refresh_btn.click(); }
        }
    }
}

function ch_dl_model_new_version(event, model_path, version_id, download_url){
    if (!confirm("\nConfirm to download.\n\nCheck Download Model Section's log and console log for detail.")) { return; }

    let js_dl_model_new_version_btn = gradioApp().getElementById("ch_js_dl_model_new_version_btn");
    if (!js_dl_model_new_version_btn) { return; }

    let msg = {
        "action": "dl_model_new_version",
        "model_path": model_path,
        "version_id": version_id,
        "download_url": download_url,
    }
    send_ch_py_msg(msg);
    js_dl_model_new_version_btn.click();
    event.stopPropagation();
    event.preventDefault();
}

function compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        if (v1Part > v2Part) { return 1; }
        else if (v1Part < v2Part) { return -1; }
    }
    return 0;
}


onUiLoaded(() => {
    let tab_prefix_list = ["txt2img", "img2img"];
    let model_type_list = ["textual_inversion", "hypernetworks", "checkpoints", "lora"];
    let cardid_suffix = "cards";

    function update_card_for_civitai(){
        let extra_network_id = "";
        let extra_network_node = null;
        let button_row = null;
        let search_term_node = null;
        let search_term = "";
        let model_type = "";
        let cards = null;
        let need_to_add_buttons = false;

        let active_tab_type = getActiveTabType();
        if (!active_tab_type){active_tab_type = "txt2img";}

        for (const tab_prefix of tab_prefix_list) {
            if (tab_prefix != active_tab_type) {continue;}

            let active_extra_tab_type = "";
            let extra_tabs = gradioApp().getElementById(tab_prefix+"_extra_tabs");
            if (!extra_tabs) {continue;}

            const active_extra_tab = Array.from(get_uiCurrentTabContent().querySelectorAll('.extra-network-cards,.extra-network-thumbs'))
                .find(el => el.closest('.tabitem').style.display === 'block')
                ?.id.match(/^(txt2img|img2img)_(.+)_cards$/)?.[2];

            if (!active_extra_tab) continue;

            switch (active_extra_tab) {
                case "textual_inversion": active_extra_tab_type = "ti"; break;
                case "hypernetworks": active_extra_tab_type = "hyper"; break;
                case "checkpoints": active_extra_tab_type = "ckp"; break;
                case "lora": active_extra_tab_type = "lora"; break;
            }

            for (const js_model_type of model_type_list) {
                switch (js_model_type) {
                    case "textual_inversion": model_type = "ti"; break;
                    case "hypernetworks": model_type = "hyper"; break;
                    case "checkpoints": model_type = "ckp"; break;
                    case "lora": model_type = "lora"; break;
                }
                if (!model_type) { continue; }
                if (model_type != active_extra_tab_type) { continue; }

                extra_network_id = tab_prefix+"_"+js_model_type+"_"+cardid_suffix;
                extra_network_node = gradioApp().getElementById(extra_network_id);
                if (!extra_network_node) continue;

                cards = extra_network_node.querySelectorAll(".card");
                for (let card of cards) {
                    button_row = card.querySelector(".button-row");
                    if (!button_row){ continue; }

                    let atags = button_row.querySelectorAll("a");
                    if (atags && atags.length) { continue; }

                    search_term_node = card.querySelector(".actions .additional .search_term");
                    if (!search_term_node){ continue; }

                    search_term = search_term_node.innerHTML.trim();
                    if (!search_term) { continue; }

                    let open_url_node = document.createElement("a");
                    open_url_node.href = "#";
                    open_url_node.innerHTML = "🌐";
                    open_url_node.className = "card-button";
                    open_url_node.title = "Open this model's civitai url";
                    open_url_node.setAttribute("onclick","open_model_url(event, '"+model_type+"', '"+search_term+"')");

                    let add_trigger_words_node = document.createElement("a");
                    add_trigger_words_node.href = "#";
                    add_trigger_words_node.innerHTML = "💡";
                    add_trigger_words_node.className = "card-button";
                    add_trigger_words_node.title = "Add trigger words to prompt";
                    add_trigger_words_node.setAttribute("onclick","add_trigger_words(event, '"+model_type+"', '"+search_term+"')");

                    let use_preview_prompt_node = document.createElement("a");
                    use_preview_prompt_node.href = "#";
                    use_preview_prompt_node.innerHTML = "🏷️";
                    use_preview_prompt_node.className = "card-button";
                    use_preview_prompt_node.title = "Use prompt from preview image";
                    use_preview_prompt_node.setAttribute("onclick","use_preview_prompt(event, '"+model_type+"', '"+search_term+"')");

                    let remove_card_node = document.createElement("a");
                    remove_card_node.href = "#";
                    remove_card_node.innerHTML = "❌";
                    remove_card_node.className = "card-button";
                    remove_card_node.title = "Remove this model";
                    remove_card_node.setAttribute("onclick","remove_card(event, '"+model_type+"', '"+search_term+"')");

                    button_row.appendChild(open_url_node);
                    button_row.appendChild(add_trigger_words_node);
                    button_row.appendChild(use_preview_prompt_node);
                    button_row.appendChild(remove_card_node);
                }
            }
        }
    }


    function update_card_for_civitai_with_sd1_8(){
        let extra_network_id = "";
        let extra_network_node = null;
        let button_row = null;
        let search_term_node = null;
        let search_term = "";
        let model_type = "";
        let cards = null;
        let need_to_add_buttons = false;
        let active_model_type = "";

        let active_tab_type = getActiveTabType();
        if (!active_tab_type){active_tab_type = "txt2img";}

        for (const tab_prefix of tab_prefix_list) {
            if (tab_prefix != active_tab_type) {continue;}

            for (const js_model_type of model_type_list) {
                let extra_tab = gradioApp().getElementById(tab_prefix+"_"+js_model_type);
                if (extra_tab == null){ continue; }
                if (extra_tab.style.display == "block"){
                    active_model_type = js_model_type;
                    break;
                }
            }

            if (!active_model_type) continue;

            switch (active_model_type) {
                case "textual_inversion": model_type = "ti"; break;
                case "hypernetworks": model_type = "hyper"; break;
                case "checkpoints": model_type = "ckp"; break;
                case "lora": model_type = "lora"; break;
            }

            if (!model_type) { continue; }

            extra_network_id = tab_prefix+"_"+active_model_type+"_"+cardid_suffix;
            extra_network_node = gradioApp().getElementById(extra_network_id);
            if (!extra_network_node) continue;

            cards = extra_network_node.querySelectorAll(".card");
            for (let card of cards) {
                button_row = card.querySelector(".button-row");
                if (!button_row){ continue; }
                button_row.style.flexWrap = "wrap";

                let atags = button_row.querySelectorAll("a");
                if (atags && atags.length) { continue; }

                search_term_node = card.querySelector(".actions .additional .search_terms");
                if (!search_term_node){ continue; }

                search_term = search_term_node.innerHTML.trim();
                if (!search_term) { continue; }
                search_term = search_term.replaceAll("\\", "\\\\");

                let open_url_node = document.createElement("a");
                open_url_node.href = "#";
                open_url_node.innerHTML = "🌐";
                open_url_node.className = "card-button";
                open_url_node.title = "Open this model's civitai url";
                open_url_node.setAttribute("onclick","open_model_url(event, '"+model_type+"', '"+search_term+"')");

                let add_trigger_words_node = document.createElement("a");
                add_trigger_words_node.href = "#";
                add_trigger_words_node.innerHTML = "💡";
                add_trigger_words_node.className = "card-button";
                add_trigger_words_node.title = "Add trigger words to prompt";
                add_trigger_words_node.setAttribute("onclick","add_trigger_words(event, '"+model_type+"', '"+search_term+"')");

                let use_preview_prompt_node = document.createElement("a");
                use_preview_prompt_node.href = "#";
                use_preview_prompt_node.innerHTML = "🏷️";
                use_preview_prompt_node.className = "card-button";
                use_preview_prompt_node.title = "Use prompt from preview image";
                use_preview_prompt_node.setAttribute("onclick","use_preview_prompt(event, '"+model_type+"', '"+search_term+"')");

                let remove_card_node = document.createElement("a");
                remove_card_node.href = "#";
                remove_card_node.innerHTML = "❌";
                remove_card_node.className = "card-button";
                remove_card_node.title = "Remove this model";
                remove_card_node.setAttribute("onclick","remove_card(event, '"+model_type+"', '"+search_term+"')");

                button_row.appendChild(open_url_node);
                button_row.appendChild(add_trigger_words_node);
                button_row.appendChild(use_preview_prompt_node);
                button_row.appendChild(remove_card_node);
            }
        }
    }


    function add_top_left_buttons(){
        for (const tab_prefix of tab_prefix_list) {
            for (const js_model_type of model_type_list) {
                let model_type = convertModelTypeFromJsToPy(js_model_type);
                if (!model_type) continue;

                let extra_network_id = tab_prefix + "_" + js_model_type + "_" + cardid_suffix;
                let extra_network_node = gradioApp().getElementById(extra_network_id);
                if (!extra_network_node) continue;

                let cards = extra_network_node.querySelectorAll(".card");
                for (let card of cards) {
                    if (card.querySelector(".ch-top-left-buttons")) continue;

                    let search_term_node = card.querySelector(".actions .additional .search_terms") || 
                                           card.querySelector(".actions .additional .search_term");
                    if (!search_term_node) continue;

                    let search_term = search_term_node.innerHTML.trim();
                    if (!search_term) continue;
                    search_term = search_term.replace(/\\/g, "\\\\");

                    let container = document.createElement("div");
                    container.className = "ch-top-left-buttons";

                    let url_btn = document.createElement("button");
                    url_btn.innerHTML = "🌐";
                    url_btn.title = "Open Civitai page";
                    url_btn.className = "ch-tl-btn ch-tl-url-btn";
                    url_btn.setAttribute("data-model-type", model_type);
                    url_btn.setAttribute("data-search-term", search_term);

                    let del_btn = document.createElement("button");
                    del_btn.innerHTML = "🗑️";
                    del_btn.title = "Delete model";
                    del_btn.className = "ch-tl-btn ch-tl-del-btn";
                    del_btn.setAttribute("data-model-type", model_type);
                    del_btn.setAttribute("data-search-term", search_term);

                    container.appendChild(url_btn);
                    container.appendChild(del_btn);

                    card.style.position = "relative";
                    card.insertBefore(container, card.firstChild);
                }
            }
        }
    }

    document.addEventListener("click", function(event){
        let btn = event.target.closest(".ch-tl-btn");
        if (!btn) return;
        event.stopPropagation();
        event.preventDefault();

        let model_type = btn.getAttribute("data-model-type");
        let search_term = btn.getAttribute("data-search-term");

        if (btn.classList.contains("ch-tl-url-btn")) {
            open_model_url(event, model_type, search_term);
        } else if (btn.classList.contains("ch-tl-del-btn")) {
            remove_card(event, model_type, search_term);
        }
    });


    let sd_version = ch_sd_version();
    let is_forge_or_new = !sd_version || compareVersions(sd_version, "1.8.0") >= 0;

    if (is_forge_or_new) {
        for (let prefix of tab_prefix_list) {
            for (const js_model_type of model_type_list) {
                let toolbar_id = prefix + "_" + js_model_type + "_controls";
                let extra_toolbar = gradioApp().getElementById(toolbar_id);
                let refresh_btn_id = prefix + "_" + js_model_type + "_extra_refresh";
                let refresh_btn = gradioApp().getElementById(refresh_btn_id);
                if (!refresh_btn) continue;
                if (!extra_toolbar) continue;

                let ch_refresh = document.createElement("button");
                ch_refresh.innerHTML = "🔁";
                ch_refresh.title = "Refresh Civitai Helper buttons";
                ch_refresh.className = "extra-network-control--refresh";
                ch_refresh.style.fontSize = "150%";
                ch_refresh.onclick = function(){
                    update_card_for_civitai_with_sd1_8();
                    add_top_left_buttons();
                };

                extra_toolbar.style.gridTemplateColumns = "minmax(0, auto) repeat(5, min-content)";
                extra_toolbar.appendChild(ch_refresh);
            }
        }

        update_card_for_civitai_with_sd1_8();
        add_top_left_buttons();

    } else {
        for (let prefix of tab_prefix_list) {
            let extra_network_refresh_btn = gradioApp().getElementById(prefix+"_extra_refresh");
            if (!extra_network_refresh_btn) continue;

            let ch_refresh = document.createElement("button");
            ch_refresh.innerHTML = "🔁";
            ch_refresh.title = "Refresh Civitai Helper buttons";
            ch_refresh.className = "lg secondary gradio-button";
            ch_refresh.style.fontSize = "200%";
            ch_refresh.onclick = function(){
                update_card_for_civitai();
                add_top_left_buttons();
            };

            extra_network_refresh_btn.parentNode.appendChild(ch_refresh);
        }

        update_card_for_civitai();
        add_top_left_buttons();
    }


    let ch_observer_timer = null;
    const ch_observer = new MutationObserver((mutations) => {
        if (ch_observer_timer) clearTimeout(ch_observer_timer);
        ch_observer_timer = setTimeout(() => {
            if (is_forge_or_new) {
                update_card_for_civitai_with_sd1_8();
            } else {
                update_card_for_civitai();
            }
            add_top_left_buttons();
        }, 300);
    });

    setTimeout(() => {
        for (const tab_prefix of tab_prefix_list) {
            for (const js_model_type of model_type_list) {
                let extra_network_id = tab_prefix + "_" + js_model_type + "_" + cardid_suffix;
                let extra_network_node = gradioApp().getElementById(extra_network_id);
                if (extra_network_node) {
                    ch_observer.observe(extra_network_node, {
                        childList: true,
                        subtree: true
                    });
                }
            }
        }
    }, 1000);

});
