// ==UserScript==
// @name        New script - 127.0.0.1:5500
// @namespace   Violentmonkey Scripts
// @match       *
// @include     *
// @grant       none
// @version     1.0
// @author      ec50n9
// @description 2022/4/11 20:00:18
// ==/UserScript==

let div = document.createElement("div");
    div.innerHTML = `
    <div id="hock_wrapper" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1em; height: 1em; overflow: visible; z-index: 999;">
        <div id="hock_line"
            style="position: absolute; top: 50%; left: 50%; height: 2px; background-color: brown; transform-origin: left center;">
        </div>
        <button id="hock_start" style="width: 5em;">发射</button>
    </div>
    <div id="hock_hock" style="position: fixed; width: 1em;height: 1em; background-color: aqua;"></div>
    `;
    document.body.appendChild(div);

    function rdl_eventHandle(e) {
        event.cancelBubble = true;
        var oPoint = document.elementFromPoint(event.clientX, event.clientY);
        console.log(oPoint);
    }

    function set_line(startElement, endElement, lineElement) {
        let x_start = Number(startElement.offsetLeft + startElement.offsetWidth / 2);
        let y_start = Number(startElement.offsetTop + startElement.offsetHeight / 2);

        let x_end = Number(endElement.offsetLeft + endElement.offsetWidth);
        let y_end = Number(endElement.offsetTop + endElement.offsetHeight);

        let dx = x_start - x_end;
        let dy = y_start - y_end;
        let dis = Math.sqrt(dx * dx + dy * dy);
        let deg = Math.atan(dy / dx) * 360 / (2 * Math.PI);
        if (deg < 0) {
            deg = 180 + deg;
        }
        if (deg == 0 && dx > 0) {
            deg = 180;
        } else if (dy > 0) {
            deg = deg - 180;
        }

        lineElement.style.width = `${dis}px`;
        lineElement.style.transform = `rotate(${deg}deg)`;
    }

    

    let hock_wrapper = document.getElementById("hock_wrapper");
    let hock_line = document.getElementById("hock_line");
    let hock_hock = document.getElementById("hock_hock");
    let hock_start = document.getElementById("hock_start");

    async function sleep(delay) {
        return new Promise((resolve) => setTimeout(resolve, delay));
    }

    (async function round() {
        const len_min = 50,
            len_max = 1000,
            deg_step = 0.01;
        let len = 50,
            x_start = Number(hock_wrapper.offsetLeft + hock_wrapper.offsetWidth / 2),
            y_start = Number(hock_wrapper.offsetTop + hock_wrapper.offsetHeight / 2);
        let deg = 0, w = 0, h = 0;
        let isExtend = false, extending = false;
        let catched, left_catched = 0, top_catched = 0;
      
        window.hock_extend = function () {
            isExtend = true;
            extending = true;
        }
        window.hock_catch = function () {
            let elements = document.elementsFromPoint(hock_hock.offsetLeft + hock_hock.offsetWidth / 2, hock_hock.offsetTop + hock_hock.offsetHeight / 2);
            for (catched of elements)
                if (!catched.id.match(/^hock_.*/))
                    break;
            if(catched){
              console.log(catched);
              catched.style.position = "fixed";
              left_catched = hock_hock.offsetLeft - catched.offsetLeft;
              top_catched = hock_hock.offsetTop - catched.offsetTop;
            }
            extending = false;
        }
        window.hock_auto = function(){
          if(isExtend){
            hock_catch();
          }else{
            hock_extend();
          }
        }

        while (true) {
            if (isExtend) {
                // 伸长
                if (extending) {
                    if (len < len_max)
                        len += 2;
                    else
                        extending = false;
                } else {
                    if (len > len_min)
                        len -= 2;
                    else {
                        catched.remove();
                        isExtend = false;
                    }
                }
            } else {
                // 旋转
                deg = deg < Math.PI * 2 ? deg + deg_step : 0;
            }
            w = Math.cos(deg) * len;
            h = Math.sin(deg) * len;
            if (catched) {
                catched.style.left = `${x_start + w - left_catched}px`;
                catched.style.top = `${y_start + h - top_catched}px`;
            }
            hock_hock.style.left = `${x_start + w - hock_hock.offsetWidth / 2}px`;
            hock_hock.style.top = `${y_start + h - hock_hock.offsetHeight / 2}px`;
            set_line(hock_wrapper, hock_hock, hock_line);
            await sleep(10);
        }
    })();

hock_start.onclick = function(){
  hock_auto();
};
