import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const url = req.query.url;

  const bs = 'https://ssstik.io';
  const hr = {
    origin: bs,
    'hx-request': 'true',
    'hx-current-url': bs + '/id',
    'content-type': 'application/x-www-form-urlencoded',
    'user-agent':
      'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0'
  };

  const z = {
    n: (i, j) => ({ status: i, creator: "Chamod Nimsara", ...j }),
    u: p => new URLSearchParams(p),
    y: (j, i) => j?.match(/:\/\/(.*?)\/(.*?)\/(.*?)\/(.*?)$/)?.[i],
    h: (...i) => new URL(...i)
  };

  try {
    if (!url || !/tiktok.com/.test(url)) {
      return res.json(z.n(false, { msg: "Please input tiktok url" }));
    }

    const wb = await axios.get(bs, { headers: hr });
    const k = wb.data.match(/s_tt = '(.*?)',/)?.[1];
    if (!k) return res.json(z.n(false, { msg: "Failed to initialize" }));

    const g = await axios.post(
      z.h('/abc', bs),
      z.u({ id: url, locale: "id", debug: "ab=0&loc=ID&ip=127.0.0.1", tt: k }),
      { params: { url: "dl" }, headers: { ...hr, "hx-target": "target", "hx-trigger": "_gcaptcha_pt" } }
    );

    const $ = cheerio.load(g.data);

    const name = $(".result_author").attr("alt");
    const pp = atob(z.y($(".result_author").attr("src"), 4));
    const title = $(".maintext").text();

    const image = [];
    $("li.splide__slide img[data-splide-lazy]").each((i, elem) => {
      image.push(atob(z.y($(elem).attr("data-splide-lazy"), 4)));
    });

    let more = {};
    if (image.length <= 0) {
      const nowm = $(".without_watermark").attr("href");
      const vhd = $(".without_watermark_hd").attr("data-directurl");
      const h = await axios.post(
        z.h(vhd, bs),
        z.u({ tt: $('input[name="tt"]').attr("value") }),
        { headers: { ...hr, "hx-trigger": "hd_download", "hx-target": "hd_download" } }
      );
      more = { type: "video", nowm, hd: h.headers["hx-redirect"] };
    } else {
      const se = await axios.post(
        "https://r.ssstik.top/b/index.sh",
        z.u({ slides_data: $('input[name="slides_data"]').attr("value") }),
        { headers: { ...hr, "hx-trigger": "slides_generate", "hx-target": "slides_generate" } }
      );
      more = { type: "slide", image, video: se.headers["hx-redirect"] };
    }

    return res.json(z.n(true, { name, pp, title, ...more }));
  } catch (e) {
    return res.json(z.n(false, { msg: e.message }));
  }
}
