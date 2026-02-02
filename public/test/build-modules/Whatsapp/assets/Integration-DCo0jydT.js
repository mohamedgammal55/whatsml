import{_ as R}from"./JsonHighlighter-ChEaFirs.js";import{_ as f}from"./UserLayout-D_lxcpvH.js";import{r as v,c as r,o as n,d as e,F as p,h as _,g as u,t as s,b as g,n as T}from"./app-fEKA3BkQ.js";import"./assetStore-BSVLrDIW.js";import"./PageHeader-DmRLoM5E.js";import"./ValidationErrors-B24rcOPH.js";const b={class:"flex items-start justify-between md:items-center"},U={class:"card max-w-max p-1"},C=["onClick"],k={class:"text-xs md:text-sm"},O={class:"mt-8 space-y-8"},x={key:0,class:"space-y-8"},N={class:"card card-body"},P={class:"mb-5 font-semibold"},$={class:"text-left leading-3"},L={key:1,class:"space-y-8"},S={class:"card card-body"},I={class:"mb-5 font-semibold"},q={class:"text-left leading-5"},w={key:2,class:"space-y-8"},M={class:"card card-body"},V={class:"mb-5 font-semibold"},B={class:"text-left leading-5"},D={key:3,class:"space-y-8"},j={class:"card card-body"},F={class:"text-left leading-5"},K={class:"card card-body"},A={class:"mb-5 font-semibold"},Y={class:"table-responsive mt-6 w-full"},z={class:"table"},J={class:"tbody"},te=Object.assign({layout:f},{__name:"Integration",props:["app","authKey"],setup(h){const o=h,l=v("curl"),m=[{title:"cUrl",value:"curl"},{title:"Php",value:"php"},{title:"NodeJs - Request",value:"nodejs"},{title:"Python",value:"python"}],c=window.location.origin+"/api/whatsapp/message",i={curl:{text:`curl --location --request POST '${c}' 

        --form 'appkey="${o.app.key}"' 

        --form 'authkey="${o.authKey}"' 

        --form 'to="RECEIVER_NUMBER"' 

        --form 'message="Example message"'`},php:{text:`$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => '${c}',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => array(
  'appkey' => '${o.app.key}',
  'authkey' => '${o.authKey}',
  'to' => 'RECEIVER_NUMBER',
  'message' => 'Example message',
  'sandbox' => 'false'
  ),
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;`},nodejs:{text:`var request = require('request');
var options = {
  'method': 'POST',
  'url': '${c}',
  'headers': {
  },
  formData: {
    'appkey': '${o.app.key}',
    'authkey': '${o.authKey}',
    'to': 'RECEIVER_NUMBER',
    'message': 'Example message'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});`},python:{text:`import requests

url = "${c}"

payload={
'appkey': '${o.app.key}',
'authkey': '${o.authKey}',
'to': 'RECEIVER_NUMBER',
'message': 'Example message',

}
files=[

]
headers = {}

response = requests.request("POST", url, headers=headers, data=payload, files=files)

print(response.text)`}};function d(t){return t.replace(/\\n/g,`
`)}const y=[{sn:1,value:"appkey",type:"string",required:"Yes",description:"Used to authorize a transaction for the app"},{sn:2,value:"authkey",type:"string",required:"Yes",description:"Used to authorize a transaction for the is valid user"},{sn:3,value:"to",type:"string",required:"Yes",description:"Who will receive the message the Whatsapp number should be full number with country code"},{sn:4,value:"message",type:"string",required:"No",description:"The transactional message max:1000 words"}],E={status:"Success",data:{from:"SENDER_NUMBER",to:"RECEIVER_NUMBER",status_code:200}};return(t,W)=>(n(),r(p,null,[e("div",b,[e("div",U,[(n(),r(p,null,_(m,a=>e("button",{key:a.value,class:T(["btn w-full px-14 py-2 md:w-auto",{"btn-primary":l.value===a.value}]),onClick:H=>l.value=a.value},[e("span",k,s(a.title),1)],10,C)),64))])]),e("div",O,[l.value==="curl"?(n(),r("div",x,[e("div",N,[e("p",P,s(t.trans("Text Message")),1),e("pre",$,s(d(i.curl.text)),1)])])):u("",!0),l.value==="php"?(n(),r("div",L,[e("div",S,[e("p",I,s(t.trans("Text Message")),1),e("pre",q,s(d(i.php.text)),1)])])):u("",!0),l.value==="nodejs"?(n(),r("div",w,[e("div",M,[e("p",V,s(t.trans("Text Message")),1),e("pre",B,s(d(i.nodejs.text)),1)])])):u("",!0),l.value==="python"?(n(),r("div",D,[e("div",j,[e("pre",F,s(d(i.python.text)),1)])])):u("",!0),e("div",K,[e("p",A,s(t.trans("Successful Json Callback")),1),g(R,{code:E})]),e("div",Y,[e("table",z,[e("thead",null,[e("tr",null,[e("th",null,s(t.trans("S/N")),1),e("th",null,s(t.trans("VALUE")),1),e("th",null,s(t.trans("TYPE")),1),e("th",null,s(t.trans("REQUIRED")),1),e("th",null,s(t.trans("DESCRIPTION")),1)])]),e("tbody",J,[(n(),r(p,null,_(y,a=>e("tr",{key:a.sn},[e("td",null,s(a.sn),1),e("td",null,s(a.value),1),e("td",null,s(a.type),1),e("td",null,s(a.required),1),e("td",null,s(a.description),1)])),64))])])])])],64))}});export{te as default};
