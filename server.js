/**
 * Created by Administrator on 2017/3/23.
 */
var http=require('http');
var fs=require('fs');
var path=require('path');
var mime=require('mime');
var cache={};
//文件不存在时报错页面
function send404(response) {
    response.writeHead(404,{'Content-Type':'text/html'});
    response.end('<head><meta charset="utf-8"></head><p>404 错误：小宝没有找到资源哦，呜呜呜呜</p>','utf-8');
}
//文件数据服务，并发送文件
function sendFile(response, filePath, fileContents) {
    response.writeHead(200,{"Content-Type":mime.lookup(path.basename(filePath))});
    response.end(fileContents);
}
//数据缓存，只有第一次访问文件系统进行读取，其余访问RAM，提供静态文件服务
function serveStatic(response, cache, absPath) {
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath]);
    }else {
        fs.exists(absPath,function (exists) {
            if(exists){
                fs.readFile(absPath,function (err, data) {
                    if(err){
                        send404(response);
                    }else {
                        cache[absPath]=data;
                        sendFile(response,absPath,data);
                    }
                });
            }else {
                send404(response);
            }
        });
    }
}
//创建http服务器的逻辑
var server=http.createServer(function (request, response) {
    var filePath=false;
    if(request.url=='/'){
        filePath='public/index.html';
    }else {
        filePath='public'+request.url;
    }
    var absPath='./'+filePath;
    serveStatic(response,cache,absPath);
});
server.listen(3000,function () {
    console.log("小宝的服务器在3000端口开始监听喽");
});
//设置socket.io服务器
var chatServer=require('./lib/chat_server');
chatServer.listen(server);

