const fs = require('fs');
const natural = require('natural');
const tokenizer = new natural.TreebankWordTokenizer();
const nounInflector = new natural.NounInflector();
const verbInflector = new natural.PresentVerbInflector();

const getPostList = ()=>{
    return new Promise((resolve,reject)=>{
        fs.readdir("./post-file/",(err,result)=>{
            if(err!==null){
                reject(err)
            }
            list = result.filter((v) => {return v.match(/en/g)})
            resolve(list)
        })
    })
}
const getPostContent = (URL)=>{
    return new Promise((resolve,reject)=>{
        fs.readFile("post-file/"+URL,(err,result)=>{
            if(err!==null){
                reject(err)
            }
            result = JSON.parse(result).content;
            resolve(result)
        })
    })
}
const getEnListBase = ()=>{
    return new Promise((resolve,reject)=>{
        fs.readFile("enList/Base.json",(err,result)=>{
            if(err!==null){
                reject(err)
            }
            result = JSON.parse(result);
            resolve(result)
        })
    })
}

const lemmatizeCheck = (word)=>{
    let returnArray=[];
    let PorterStemmer = natural.PorterStemmer.stem(word);
    let single = nounInflector.singularize(word)
    let verb = verbInflector.pluralize(word)
    if(word!==PorterStemmer){
        returnArray.push(PorterStemmer)
    }
    if(word!==single){
        returnArray.push(single)
    }
    if(word!==verb){
        returnArray.push(verb)
    }
    return returnArray;
}

const createENJSON = async ()=>{
    const list = await getPostList();
    let enSentence = "";
    let enSentenceTmp = "";
    const enListBase = await getEnListBase();
    const enListWordKey = Object.keys(enListBase)
    let lemArray = [];
    let json = {};
    for(key in list){
        enSentenceTmp += " " + await getPostContent(list[key]);
    }
    enSentence = enSentenceTmp.toLowerCase();
    let preenWordArrays = Array.from(new Set(enSentence.match(/[-\w]+/g)));

    preenWordArrays = preenWordArrays.concat(tokenizer.tokenize(enSentenceTmp.replace(/>|</g," ")));
    preenWordArrays = Array.from(new Set(preenWordArrays))

    console.log("1 "+preenWordArrays.length)
    for( key in preenWordArrays ){
        let returnLemData = await lemmatizeCheck(preenWordArrays[key]);
        if(returnLemData.length!==0){
            lemArray = lemArray.concat(returnLemData)
        }
    }
    let preenWordArray = preenWordArrays.concat(lemArray)
    console.log("2 "+preenWordArray.length)
    let enWordArray = Array.from(new Set(preenWordArray))
    console.log("3 "+enWordArray.length)
    let idiomArray = []
    for(key in enWordArray){
        let enWord = enWordArray[key]
        enWord.replace(/\.$/,"")
        .replace(/\./g, "\\\\.")
        .replace(/\*/g, "\\\\*")
        .replace(/\+/g, "\\\\+")
        .replace(/\^/g, "\\\\^")
        .replace(/\|/g, "\\\\|")
        .replace(/\[/g, "\\\\[")
        .replace(/\]/g, "\\\\]")
        .replace(/\(/g, "\\\\(")
        .replace(/\)/g, "\\\\)")
        .replace(/\?/g, "\\\\?")
        .replace(/\$/g, "\\\\$")
        .replace(/\{/g, "\\\\{")
        .replace(/\}/g, "\\\\}")
        if(enWord.length>2){
            let words = enListWordKey.filter(RegExp.prototype.test, new RegExp(`${enWord}`,"i"));
            for(index in words){
                if(words[index]!==enWordArray[key]&&enSentence.indexOf(words[index]) != -1){
                    //console.log("pick UP "+words[index])
                    idiomArray.push(words[index])
                }
            }
        }
    }
    console.log("idiomArrray="+idiomArray.length)
    enWordArray = enWordArray.concat(idiomArray)
    console.log("4 "+enWordArray.length)
    enWordArray = Array.from(new Set(enWordArray))
    console.log("5 "+enWordArray.length)
    //console.log(enWordArray)
    for(key in enWordArray){
        if(enListBase[enWordArray[key]]!==undefined){
            json[enWordArray[key]] = enListBase[enWordArray[key]];
        }else{
            //json[enWordArray[key]] = "不明";
        }
    }
    fs.writeFile('enList/translation.json', JSON.stringify(json, null, '    '),(err,result)=>{
        if(err!=null){
            console.error(err);
        }
        console.log("DONE!"+Object.keys(json).length)
    });
}

createENJSON()