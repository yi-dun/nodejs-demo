var utils = require("./utils");
//产品密钥ID，产品标识
var secretId = "your_secret_id";
// 产品私有密钥，服务端生成签名信息使用，请严格保管，避免泄露
var secretKey = "your_secret_key";
// 易盾反垃圾云服务融媒体解决方案离线结果获取接口地址
var apiurl = "https://as.dun.163.com/v1/stream/callback/results";

// 请求参数
var post_data = {
    // 1.设置公有有参数
    secretId: secretId,
    version: "v1",
    timestamp: new Date().getTime(),
    nonce: utils.noncer(),
    signatureMethod: "MD5", // MD5, SM3, SHA1, SHA256
};

var signature = utils.genSignature(secretKey, post_data);
post_data.signature = signature;

// http请求结果
var responseCallback = function (responseData) {
    console.log(responseData);
    var data = JSON.parse(responseData);
    var code = data.code;
    var msg = data.msg;
    if (code === 200) {
        var result = data.result;
        if (result.length === 0) {
            console.log("暂时没有结果需要获取，请稍后重试！");
        } else {
            for (let i = 0; i < result.length; i++) {
                var obj = result[i];
                var antispam = obj.antispam;
                var sessionId = obj.sessionId;
                var sessionTaskId = obj.sessionTaskId;
                var suggestion = antispam.suggestion;
                var label = antispam.label;
                console.log(`sessionTaskId=${sessionTaskId}, sessionId=${sessionId}, suggestion=${suggestion}, label=${label}`);
            }
        }
    } else {
        console.log('ERROR: code=' + code + ',msg=' + msg);
    }
}
utils.sendHttpRequest(apiurl, "POST", post_data, responseCallback);