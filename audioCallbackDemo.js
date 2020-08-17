﻿var utils=require("./utils");
//产品密钥ID，产品标识 
var secretId="your_secret_id";
// 产品私有密钥，服务端生成签名信息使用，请严格保管，避免泄露
var secretKey="your_secret_key";
// 业务ID，易盾根据产品业务特点分配
var businessId="your_business_id";
// 易盾反垃圾云服务音频离线结果获取接口地址
var apiurl="http://as.dun.163.com/v3/audio/callback/results";

//请求参数
var post_data = {
	// 1.设置公有有参数
	secretId:secretId,
	businessId:businessId,
	// 点播语音版本v3.2及以上二级细分类结构进行调整
	version:"v3.2",
	timestamp:new Date().getTime(),
	nonce:utils.noncer()
};
var signature=utils.genSignature(secretKey,post_data);
post_data.signature=signature;
//http请求结果
var responseCallback=function(responseData){
	console.log(responseData);
	var data = JSON.parse(responseData);
	var code=data.code;
	var msg=data.msg;
	if(code==200){
		var result=data.antispam;
		if(result.length==0){
			console.log("暂时没有结果需要获取，请稍后重试！");
		}else{
			for(var i=0;i<result.length;i++){
				var obj=result[i];
				var taskId = obj.taskId;
                var asrStatus = obj.asrStatus;
                if(asrStatus==4){
                    var asrResult = obj.asrResult;
                    console.log("检测失败:taskId="+taskId+",asrResult="+asrResult);
				}else{
                    var action = obj.action;
                    var labels = obj.labels;
                    if (action === 0) {
                        console.log("通过:taskId="+taskId);
					} else if (action === 1 || action === 2) {
						for(var j=0;j<labels.length;j++){
							var labelInfo = labels[j];
							var label = labelInfo.label;
							var level = labelInfo.level;
							// 注意二级细分类结构
							var subLabels = labelInfo.subLabels;
							for(var k=0;k<subLabels.length;k++) {
							    var subLabelObj = subLabels[k];
							    var subLabel = subLabelObj.subLabel;
							    var details = subLabelObj.details;
                                var hintArr = details.hint;
							}
						}
                        console.log("结果："+action==1?"不确定":"不通过"+"!taskId="+taskId);
					}
				}
			}
		}
	} else {
		console.log('ERROR:code=' + code+',msg='+msg);
	}
};
utils.sendHttpRequest(apiurl,"POST",post_data,responseCallback);
