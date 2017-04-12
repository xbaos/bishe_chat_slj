/**
 * Created by Administrator on 2017/3/24.
 */
//显示可疑文本的方法
function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}
//显示房间列表的方法
// function divEscapedContentElement_roomList(message) {
//     return $('<div></div>').html('<a href="#"><span>'+message+'</span></a>');
//     // return $('<div><a href="#"><span class="room_list_name"></span></a></div>');
// }
//显示系统创建的受信内容
function divSystemContentElement(message) {
    return $('<div></div>').html('<i>'+message+'</i>');
}
//处理原始用户输入的方法，/开头，处理为命令，不加/，处理为消息，发送服务器，并广播给其他用户
function processUserInput(chatApp) {
    var message=$('#send-massage').val();
    // chatApp.set()
    var systemMessage;
    if(message.charAt(0)=='/'){
        systemMessage=chatApp.processCommand(message);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }else {
        console.log('消息内容'+message);
        chatApp.sendMessage($('#room_name').text(),message);
        $('#messages').append(divEscapedContentElement(message));
        console.log('成功发送消息'+message);
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-massage').val('');
}
//客户端程序初始化逻辑
var socket=io.connect();
$(document).ready(function () {
    var chatApp = new Chat(socket);
    //显示更改昵称的尝试结果
    socket.on('nameResult', function (result) {
        var message;
        if (result.success) {
            message = '你现在被叫做' + result.name + '了哦，思密达';
        } else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });
    //显示房间变更的结果
    socket.on('joinResult', function (result) {
        $('#room_name').text(result.room);
        $('#room_name').attr("data-hover",result.room);
        $('#messages').append('房间更改了');
    });
    //显示接收到的消息
    socket.on('message', function (message) {
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });
    //显示可用房间列表
    socket.on('rooms', function (rooms) {
        $('#room-list').empty();
        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room != '') {
                $('#room-list').append('<div><a href="#"><span>'+room+'</span></a></div>');
                // $('#room-list_name').text(room);
            }
        }
        $('#room-list div').click(function () {
            chatApp.processCommand('/join ' + $(this).text());//单击房间名可切换至该房间
            $('#send-massage').focus();
        });
    });
//    定期请求可用的房间列表
    setInterval(function () {
        socket.emit('rooms');
    }, 1000);
    $('#send-massage').focus();
    $('#send-button').click(function () {
        processUserInput(chatApp);
        return false;
    });
});