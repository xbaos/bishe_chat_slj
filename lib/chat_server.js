/**
 * Created by Administrator on 2017/3/24.
 */
var socketio=require('socket.io');
var sex;
var io;
var guestNumber=1;
var nickNames={};//存放昵称，并与客户端连接ID关联
var namesUsed=[];//存放已经被占用的昵称
var currentRoom={};//记录用户当前房间
exports.setSex=function (sex) {
    sex=sex;
};
//聊天服务器函数，用来启动Socket.io服务器，控制台输出，处理连接
exports.listen=function (server) {
    io=socketio.listen(server);//    启动Socket.io服务器，允许他搭载在已有的http服务器上
    console.log('chat_server聊天服务器模块开始监听哦');
    io.set('log level',1);
    io.sockets.on('connection',function (socket) {//定义每个用户连接的处理逻辑
        guestNumber=assignGuestName(socket,guestNumber,nickNames,namesUsed);//在用户连接上来时，赋予其一个访客名
        joinRoom(socket,'xbao');
        handleMessageBroadcasting(socket,nickNames);//处理用户的消息
        handleNameChangeAttempts(socket,nickNames,namesUsed);//聊天室的创建与变更
        handleRoomJoining(socket);
        socket.on('rooms',function () {
            socket.emit('rooms',io.sockets.manager.rooms);//用户发出请求时，向其提供已经被占用的聊天室列表
        });
        handleClientDisconnection(socket,nickNames,namesUsed);
    });
};
//分配用户昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed) {
    var name='小宝'+guestNumber+'号';
    nickNames[socket.id]=name;//用户昵称与客户端连接id关联
    socket.emit('nameResult',{//让用户知道他们的昵称
        success:true,
        name:name
    });
    namesUsed.push(name);
    return guestNumber+1;
}
//用户加入聊天室
function joinRoom(socket,room) {
    socket.join(room);
    currentRoom[socket.id]=room;
    socket.emit('joinResult',{room:room});//让用户知道他进入了新的房间
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id]+'已经加入'+room+'了哦，么么哒！！！'
    });//让房间里其他用户知道有新用户加入了房间
    var usersInRoom=io.sockets.clients(room);//确定有哪些用户在这个房间里
    if(usersInRoom.length>1){//如果不止一个用户在当前房间，汇总一下其他用户
        var usersInRoomSummary='当前在'+room+'房间内的用户有：';
        for (var index in usersInRoom){
            var userSocketId=usersInRoom[index].id;
            if(userSocketId!=socket.id){
                if(index>0){
                    usersInRoomSummary+=',';
                }
                usersInRoomSummary+=nickNames[userSocketId];
            }
        }
        usersInRoomSummary+='嗯哼，就这些，啦啦啦';
        socket.emit('message',{text:usersInRoomSummary});
    }
}
//更名请求的处理逻辑
function handleNameChangeAttempts(socket,nickNames,namesUsed) {
    socket.on('nameAttempt',function (name) {
        if(name.indexOf('小宝')==0){
            socket.emit('nameResult',{
                success:false,
                message:'新名字不能以"小宝"开头哦，阿里嘎多!'
            });
        }else {
            if(namesUsed.indexOf(name)==-1){
                var previousName=nickNames[socket.id];
                var previousNameIndex=namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id]=name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:previousName+'现在改名为'+name+'了哦，小伙伴们'
                });
            }else {
                socket.emit('nameResult',{
                    success:false,
                    message:'真是可惜，您起的新名字已经被抢先了哦'
                });
            }
        }
    });
}
//服务端发送聊天消息
function handleMessageBroadcasting(socket) {
    socket.on('message',function (message) {
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id]+':'+message.text
        });
    });
}
//服务端处理用户切换房间
function handleRoomJoining(socket) {
    socket.on('join',function (room) {
       socket.leave(currentRoom[socket.id]);
       joinRoom(socket,room.newRoom); 
    });
}
//用户离开后断开连接、
function handleClientDisconnection(socket) {
    socket.on('disconnect',function () {
        var nameIndex=namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}