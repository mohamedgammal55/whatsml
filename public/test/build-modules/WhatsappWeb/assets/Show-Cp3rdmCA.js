import{_ as f}from"./UserLayout-DG2qUs8x.js";import{k as y,c as r,o as n,b as e,F as c,g as m,f as p,t as s,n as v}from"./app-B4kV47qU.js";import"./sharedComposable-VJJUONp6.js";import"./toastComposable-CvcyPmJb.js";import"./Modal-ChMy0A7y.js";import"./modalStore-BgORG3Nn.js";import"./_plugin-vue_export-helper-DlAUqK2U.js";import"./ToastrContainer-Cfx6wOd2.js";import"./AssetModal-vtiWQmiY.js";import"./IntersectionObserver-DbdokySM.js";import"./assetStore-cDK0Afhq.js";const k={class:"flex flex-col items-center justify-between gap-2 xl:flex-row"},T={class:"card max-w-max p-1"},C=["onClick"],x={class:"text-xs md:text-sm"},U={class:"card max-w-max p-1"},w=["onClick"],O={class:"text-xs md:text-sm"},S={class:"mt-8 space-y-8"},P={key:0,class:"space-y-8"},$={class:"card card-body"},N={class:"mb-5 font-semibold"},L={class:"overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900"},I={key:1,class:"space-y-8"},q={class:"card card-body"},M={class:"mb-5 font-semibold"},V={class:"overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900"},B={key:2,class:"space-y-8"},D={class:"card card-body"},j={class:"mb-5 font-semibold"},F={class:"overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900"},K={key:3,class:"space-y-8"},A={class:"card card-body"},Y={class:"mb-5 font-semibold"},z={class:"overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900"},H={class:"card card-body"},J={class:"mb-2 font-semibold"},Q={class:"table-responsive mt-6 w-full"},W={class:"table"},G={class:"tbody"},ue=Object.assign({layout:f},{__name:"Show",props:["app","authKey"],setup(b){const o=b,l=y("curl"),d=y("text"),g=[{title:"cUrl",value:"curl"},{title:"Php",value:"php"},{title:"NodeJs",value:"nodejs"},{title:"Python",value:"python"}],E=[{title:"Text",value:"text"}],u={curl:{text:`curl --location --request POST '${route("user.whatsapp-web.api.send-message")}' 

--form 'app_key="${o.app.key}"' 

--form 'auth_key="${o.authKey}"' 

--form 'to="RECEIVER_NUMBER"' 

--form 'type="text"' 

--form 'message="Example message"'`},php:{text:`$curl = curl_init();
      curl_setopt_array($curl, array(
      CURLOPT_URL => '${route("user.whatsapp-web.api.send-message")}',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_POSTFIELDS => array(
      'app_key' => '${o.app.key}',
      'auth_key' => '${o.authKey}',
      'to' => 'RECEIVER_NUMBER',
      'message' => 'Example message',
      ),
    ));

    $response = curl_exec($curl);

    curl_close($curl);
    echo $response;`},nodejs:{text:`var request = require('request');
    var options = {
      'method': 'POST',
      'url': '${route("user.whatsapp-web.api.send-message")}',
      'headers': {
      },
      formData: {
        'app_key': '${o.app.key}',
        'auth_key': '${o.authKey}',
        'to': 'RECEIVER_NUMBER',
        'message': 'Example message'
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });`},python:{text:`import requests

    url = "${route("user.whatsapp-web.api.send-message")}"

    payload={
    'app_key': '${o.app.key}',
    'auth_key': '${o.authKey}',
    'to': 'RECEIVER_NUMBER',
    'message': 'Example message',

    }
    files=[]
    headers = {}
    response = requests.request("POST", url, headers=headers, data=payload, files=files)
    print(response.text)`}};function i(a){return a.replace(/\\n/g,`
`)}const R=[{value:"app_key",type:"string",required:"Yes",description:"Used to authorize a transaction for the app"},{value:"auth_key",type:"string",required:"Yes",description:"Used to authorize a transaction for the is valid user"},{value:"to",type:"string",required:"Yes",description:"Recipient Whatsapp number should be full number with country code"},{value:"message",type:"string",required:"Required",description:"The message to be sent. The message can be in text only"}];return(a,h)=>(n(),r(c,null,[e("div",k,[e("div",T,[(n(),r(c,null,m(g,t=>e("button",{key:t.value,class:v(["btn w-full px-14 py-2 md:w-auto",{"btn-primary":l.value===t.value}]),onClick:_=>l.value=t.value},[e("span",x,s(t.title),1)],10,C)),64))]),e("div",U,[(n(),r(c,null,m(E,t=>e("button",{key:t.value,class:v(["btn w-full px-14 py-2 md:w-auto",{"btn-primary":d.value===t.value}]),onClick:_=>d.value=t.value},[e("span",O,s(t.title),1)],10,w)),64))])]),e("div",S,[l.value==="curl"?(n(),r("div",P,[e("div",$,[e("p",N,s(a.trans("Send Message")),1),e("pre",L,s(i(u.curl[d.value])),1)])])):p("",!0),l.value==="php"?(n(),r("div",I,[e("div",q,[e("p",M,s(a.trans("Send Message")),1),e("pre",V,s(i(u.php[d.value])),1)])])):p("",!0),l.value==="nodejs"?(n(),r("div",B,[e("div",D,[e("p",j,s(a.trans("Send Message")),1),e("pre",F,s(i(u.nodejs[d.value])),1)])])):p("",!0),l.value==="python"?(n(),r("div",K,[e("div",A,[e("p",Y,s(a.trans("Send Message")),1),e("pre",z,s(i(u.python[d.value])),1)])])):p("",!0),e("div",H,[e("p",J,s(a.trans("Successful Json Callback")),1),h[0]||(h[0]=e("pre",{class:"rounded bg-gray-100 p-2 dark:bg-dark-900"},`{
  "status": "Success",
  "data": {
    "from": "SENDER_NUMBER",
    "to": "RECEIVER_NUMBER",
    "status_code": 200
  }
}      `,-1))]),e("div",Q,[e("table",W,[e("thead",null,[e("tr",null,[e("th",null,s(a.trans("S/N")),1),e("th",null,s(a.trans("VALUE")),1),e("th",null,s(a.trans("TYPE")),1),e("th",null,s(a.trans("REQUIRED")),1),e("th",null,s(a.trans("DESCRIPTION")),1)])]),e("tbody",G,[(n(),r(c,null,m(R,(t,_)=>e("tr",{key:t.sn},[e("td",null,s(_+1),1),e("td",null,s(t.value),1),e("td",null,s(t.type),1),e("td",null,s(t.required),1),e("td",null,s(t.description),1)])),64))])])])])],64))}});export{ue as default};
