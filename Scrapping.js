// the purpose of this project is to extract information of worldcup 2019 from cricinfo and present that in the 
// form of excel and pdf scorecards
// the real purpose is to learn how to extract information and get experience with js
// npm init
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib
// node Project1.js --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results --excel=WorldCup10.csv --dataFolder=data
let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs =require("fs");
let path = require("path");
let args = minimist(process.argv);
let responseKaPromise = axios.get(args.source);
responseKaPromise.then(function(response){
    let html = response.data;
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;
    let matchInfo = document.querySelectorAll("div.match-score-block");
    let matches = [];
    for(let i=0;i<matchInfo.length;i++){
        let match = {
             t1 : "",
             t2 :"",
             t1s : "",
             t2s : "",
             result : ""
        };
        let nameps = matchInfo[i].querySelectorAll("p.name");
        match.t1 = nameps[0].textContent;
        match.t2 = nameps[1].textContent;
                                 
        let score = matchInfo[i].querySelectorAll("div.score-detail > span.score");
        if(score.length ==2){
           match.t1s = score[0].textContent;
           match.t2s = score[1].textContent;
        }else if(score.length == 1){
            match.t1s = score[0].textContent;
            match.t2s = "";
        }
        else{
            match.t1s = "";
            match.t2s = "";
        }
        let result = matchInfo[i].querySelector("div.status-text > span");
        match.result = result.textContent;
        matches.push(match);
    }
   let matchesJSON = JSON.stringify(matches);
   fs.writeFileSync("matches.json",matchesJSON,"utf-8");
    let teams=[];
    for(let i=0;i<matches.length;i++){
        putTeamsInArrayIfMissing(teams,matches[i]);
    }
    for(let i=0;i<matches.length;i++){
        putMatchesInAppropriateTeams(teams,matches[i]);
    }
    let teamsJson = JSON.stringify(teams);
    fs.writeFileSync("teams.json",teamsJson,"utf-8");
    createExcelFile(teams);
    createFolders(teams);

}).catch(function(err){
    console.log(err);
})
function createFolders(teams){
    fs.mkdirSync(args.dataFolder);
    for(let i=0;i<teams.length;i++){
    let teamfn = path.join(args.dataFolder,teams[i].name);
    fs.mkdirSync(teamfn);
    
    for(let j=0;j<teams[i].matches.length;j++){
        let matchfilename = path.join(teamfn,teams[i].matches[j].vs + ".pdf");
    createScoreCard(teams[i].name,teams[i].matches[j],matchfilename);
    }
    }
}

function createScoreCard(teamname,match,matchfilename){
    let t1 = teamname;
    let t2 = match.vs;
    let t1score = match.selfScore;
    let t2score = match.opScore;
    let result = match.result;
    let bytesofpdf = fs.readFileSync("Team 1.pdf");
    let pdfkapromise = pdf.PDFDocument.load(bytesofpdf);
    pdfkapromise.then(function(pdfdoc){
        let page = pdfdoc.getPage(0);
        
        page.drawText(t1 , {
            x : 320,
            y : 645
 
         })
         page.drawText(t2 , {
            x : 320,
            y : 605
 
         })
         page.drawText(t1score , {
            x : 320,
            y : 565
         })
        
         page.drawText(t2score , {
            x : 320,
            y : 525
         })
         page.drawText(result , {
            x : 290,
            y : 485,
            size : 20
 
         })




        let finalpdfdbyteskapromise =  pdfdoc.save();
        finalpdfdbyteskapromise.then(function(finalBytes){
            fs.writeFileSync(matchfilename,finalBytes);
        })

    })
}
function createExcelFile(teams){
    let wb = new excel.Workbook();
    for(let i=0;i<teams.length;i++){
        let sheet = wb.addWorksheet(teams[i].name);
        sheet.cell(2,1).string("VS");
        sheet.cell(2,2).string("Self Score");
        sheet.cell(2,3).string("Opponent Score");
        sheet.cell(2,4).string("Result");
        for(let j=0;j<teams[i].matches.length;j++){
            
            sheet.cell(j+3,1).string(teams[i].matches[j].vs);
            sheet.cell(j+3,2).string(teams[i].matches[j].selfScore);
            sheet.cell(j+3,3).string(teams[i].matches[j].opScore);
            sheet.cell(j+3,4).string(teams[i].matches[j].result);
        }
    }
    wb.write(args.excel);
}
function putTeamsInArrayIfMissing(teams,match){
    let t1idx = -1;
    for(let i=0;i<teams.length;i++){
          if(teams[i].name == match.t1){
              t1idx = i;
              break;
          }
    }
    if(t1idx == -1){
        teams.push({
            name: match.t1,
            matches : []
         })
    }
    let t2idx = -1;
    for(let i=0;i<teams.length;i++){
          if(teams[i].name == match.t2){
              t2idx = i;
              break;
          }
    }
    if(t2idx == -1){
        teams.push({
            name: match.t2,
            matches : []
         })
    }
}
function putMatchesInAppropriateTeams(teams,match){
    let t1idx = -1;
    for(let i=0;i<teams.length;i++){
          if(teams[i].name == match.t1){
              t1idx = i;
              break;
          }
    }
    let team1 = teams[t1idx];
    team1.matches.push({
       vs:match.t2,
       selfScore:match.t1s,
       opScore: match.t2s,
       result : match.result
        })

        let t2idx = -1;
    for(let i=0;i<teams.length;i++){
          if(teams[i].name == match.t2){
              t2idx = i;
              break;
          }
    }
       let team2 = teams[t2idx];
      team2.matches.push({
       vs:match.t1,
       selfScore:match.t2s,
       opScore: match.t1s,
       result : match.result
        });
    }

