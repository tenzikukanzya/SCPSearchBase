const client = require('cheerio-httpcli');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');

const listJPBase = "http://ja.scp-wiki.net/scp-series"
const jpMax = 2
const jpData = [listJPBase,jpMax]
const listEnBase = "http://www.scp-wiki.net/scp-series"
const enMax = 5
const enData = [listEnBase,enMax]

const allowTags = [
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'p',
    'a',
    'ul',
    'ol',
    'nl',
    'li',
    'b',
    'i',
    'strong',
    'em',
    'strike',
    'code',
    'hr',
    'br',
    'div',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'h1',
    'h2'
]

/**
 * 現在時刻取得用
 */
function getTime(){
    const date = new Date();
    const year = String(date.getFullYear()).padStart(4, 0);
    const mounth = String(date.getMonth()+1).padStart(2, 0);
    const day = String(date.getDate()).padStart(2, 0);
    const hour = String(date.getHours()).padStart(2, 0);
    const minute = String(date.getMinutes()).padStart(2, 0);
    const time = parseInt(year+mounth+day+hour+minute,10);
    return time;
}

const today = getTime()

/**
 * SCP Foundationの記事URLを返す関数
 * @param  {Number} number 対象のSCP番号
 * @return {String}       URL
 */
const urlENBase = (number)=>{
    let padS = 4
    if(number<999){
        padS = 3
    }
    return "http://www.scp-wiki.net/scp-" + number.toString().padStart(padS, "0")
}

/**
 * SCP財団の記事URLを返す関数
 * @param  {Number} number 対象のSCP番号
 * @return {String}       URL
 */
const urlJPBase = (number)=>{
    let padS = 4
    if(number<999){
        padS = 3
    }
    return "http://ja.scp-wiki.net/scp-" + number.toString().padStart(padS, "0") + "-jp"
}

/**
 * SCPの記事一覧を返す関数
 * @param  {Array} DataArray シリーズ情報が格納されている
 * @return {Array}       SCPの記事一覧
 */
const getList = (DataArray)=>{
    let seriesListArrrays = []
    for(let i=1;i<=DataArray[1];i++){
        let listURL = DataArray[0]
        if(i!==1){
            listURL = DataArray[0] +"-"+i;
        }
        let response = client.fetchSync(listURL);
        let dom = new JSDOM(response.body);
        let list = dom.window.document.querySelector(".series").innerHTML.match(/(<a[^>]*href="\/.+">SCP-.+)|(<a[^>]*href="\/scp-[0-9]+.*">.+)/g);
        seriesListArrrays = seriesListArrrays.concat(list)
    }
    for(key in seriesListArrrays){
        seriesListArrrays[key] = seriesListArrrays[key].split(/<[^>]*>/g).join("");
        seriesListArrrays[key] = seriesListArrrays[key].split(/&quot;/g).join("\"");
        seriesListArrrays[key] = seriesListArrrays[key].split(/&#8230;/g).join("\…");
    }
    return seriesListArrrays
}

/**
 * スリープ関数
 * @param  {Number} sec 秒数
 */
const sleep = (sec)=>{
    new Promise(resolve => setTimeout(resolve, sec*1000));
}
/**
 * 記事取得関数
 * @param  {String} URL SCPの記事URL
 * @return {String}  スクレイピング結果      
 */
const getPost = (URL)=>{
    let response = client.fetchSync(URL);
    let dom = new JSDOM(response.body);
    let content = dom.window.document.querySelector("#page-content");
    let removeElement = dom.window.document.querySelector(".scp-image-block");
    try{
        while(removeElement!==null){
            removeElement.parentNode.removeChild(removeElement);
            removeElement = dom.window.document.querySelector(".scp-image-block");
        }
    }catch(e){
        console.log(URL+":Not Found Image");
    }
    try{
        removeElement = content.querySelector(".page-rate-widget-box")
        removeElement.parentNode.removeChild(removeElement)
    }catch(e){
        console.log(URL+":Not Found VoteModule");
    }
    content = content.innerHTML;
    return content;
}

/**
 * ファイル作成関数
 * @param  {Number} start 開始番号
 * @param  {Number} stop 終了番号
 */
const createPostJSON = async (start,stop)=>{
    const JapanList = await getList(jpData);
    await sleep(3);
    const EnList = await getList(enData);
    for(let i=start;i<=stop;i++){
        let padS = 4
        if(i<=999){
            padS = 3
        }
        let contentEn = sanitizeHtml(getPost(urlENBase(i)), {
            allowedTags: allowTags,
            allowedClasses: {}
        });
        await sleep(3);
        let contentJP = sanitizeHtml(getPost(urlJPBase(i)), {
            allowedTags: allowTags,
            allowedClasses: {}
        });


        let postJP = {};
        let postEn = {};
        postJP.title = JapanList[i-1];
        postEn.title = EnList[i-1];
        postJP.content = contentJP;
        postEn.content = contentEn;
        postJP.time = today;
        postEn.time = today;
        try{
            fs.writeFile(`./post-file/scp-${i.toString().padStart(padS, "0")}-en.json`, JSON.stringify(postEn, null, '    '),(err,result)=>{if(err){throw new Error(err)};});
            fs.writeFile(`./post-file/scp-${i.toString().padStart(padS, "0")}-jp.json`, JSON.stringify(postJP, null, '    '),(err,result)=>{if(err){throw new Error(err)};});
        }catch(e){
            console.log(e)
        }
        console.log(`scp-${i.toString().padStart(padS, "0")}完了\n`)
    }
}

//最初の引数に開始する番号、2つ目に終了する番号
createPostJSON(71,100);
