fs.readFile("EJDict/release/ejdic-hand-utf8.txt","utf-8",(err,data)=>{
    if(err!==null){
        throw new Error(err);
    }
    const enWord = data.match(/(.+)(?=\t)/g);
    const jpExplanation = data.match(/(?<=\t)(.*)/g);
    let json = {};
    let wordTempArray = []
    for(key in enWord){
        let loopCount = 1;
        if(enWord[key].match(/,/g)!==null){
            loopCount = enWord[key].match(/,/g).length;
        }
        if(loopCount>1){
            wordTempArray = enWord[key].split(",");
        }else{
            wordTempArray[0] = enWord[key]
        }
        for(let i=0;i<loopCount;i++){
            if(json[wordTempArray[i]]!==undefined){
                json[wordTempArray[i]] += "\n" + jpExplanation[key]
            }else{
                json[wordTempArray[i]] = jpExplanation[key]
            }
        }
    }
    fs.writeFile(`./enList/Base.json`, JSON.stringify(json, null, '    '),(err,result)=>{if(err){throw new Error(err)};});
})