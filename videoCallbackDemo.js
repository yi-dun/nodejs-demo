﻿var http=require('https');
var urlutil=require('url');
var querystring = require('querystring');
var crypto = require('crypto');
var md5er = crypto.createHash('md5');//MD5加密工具

//产品密钥ID，产品标识 
var secretId="your_secret_id";
// 产品私有密钥，服务端生成签名信息使用，请严格保管，避免泄露 
var secretKey="your_secret_key";
// 业务ID，易盾根据产品业务特点分配 
var businessId="your_business_id";
// 易盾反垃圾云服务点播离线结果获取接口地址 
var apiurl="https://api.aq.163.com/v2/video/callback/results";
var urlObj=urlutil.parse(apiurl);
var host=urlObj.hostname;
var path=urlObj.path;
var port=urlObj.port;
//产生随机整数--工具方法
var noncer=function(){
	var range=function(start,end){
		var array=[];
		for(var i=start;i<end;++i){
			array.push(i);
		}
		return array;
	};
	var nonce = range(0,6).map(function(x){
		return Math.floor(Math.random()*10);
	}).join('');
	return nonce;
}

//生成签名算法--工具方法
var genSignature=function(secretKey,paramsJson){
	var sorter=function(paramsJson){
		var sortedJson={};
		var sortedKeys=Object.keys(paramsJson).sort();
		for(var i=0;i<sortedKeys.length;i++){
			sortedJson[sortedKeys[i]] = paramsJson[sortedKeys[i]]
		}
		return sortedJson;
	}
	var sortedParam=sorter(paramsJson);
	var needSignatureStr="";
	var paramsSortedString=querystring.stringify(sortedParam,'&&',"&&",{
			encodeURIComponent:function(s){
				return s;
			}
		})+secretKey;
	needSignatureStr=paramsSortedString.replace(/&&/g,"");
	md5er.update(needSignatureStr,"UTF-8");
	return md5er.digest('hex');
};
//请求参数
var post_data = {
	// 1.设置公有有参数
	secretId:secretId,
	businessId:businessId,
	version:"v2",
	timestamp:new Date().getTime(),
	nonce:noncer()
};
var signature=genSignature(secretKey,post_data);
post_data.signature=signature;
var content = querystring.stringify(post_data,null,null,null);
var options = {
    hostname: host,
    port: port,
    path: path,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		'Content-Length': Buffer.byteLength(content)
    }
};

var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    var responseData = "";
    res.on('data', function (chunk) {
    	responseData+=chunk;
    });
    res.on("end",function(){
    	var data = JSON.parse(responseData);
		var code=data.code;
		var msg=data.msg;
		if(code==200){
			var result=data.result;
			if(result.length==0){
				console.log("无数据");
			}else{
				for(var i=0;i<result.length;i++){
					var obj=result[i];
					var callback=obj.callback;
					var evidence=obj.evidence;
					var labelsArray=obj.labels;
					if(labelsArray.length==0){
						console.log("正常，callback:"+callback+",证据信息："+JSON.stringify(evidence));
					}else{
						for(var k=0;k<labelsArray.length;k++){
							var labelObj=labelsArray[k];
							var label=labelObj.label;
							var level=labelObj.level;
							var rate=labelObj.rate;
							console.log("异常，callback:"+callback+",分类："+JSON.stringify(labelObj)+",证据信息："+JSON.stringify(evidence));
						}
					}
				}
			}
		}else{
			 console.log('ERROR:code=' + code+',msg='+msg);
		}
    });
});
//设置超时
req.setTimeout(1000,function(){
	console.log('request timeout!');
	req.abort();
});
req.on('error', function (e) {
    console.log('request ERROR: ' + e.message);
});
req.write(content);
req.end();
