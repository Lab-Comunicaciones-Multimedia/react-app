import React, { Component, Fragment } from 'react';
import {Janus} from 'janusjs-sdk'
import Button from '@material-ui/core/Button'
import CssBaseline from '@material-ui/core/CssBaseline';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Grid from '@material-ui/core/Grid';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import {VideoIcon,VideoOffIcon,AudioIcon,AudioOffIcon} from '../img/svgIcons'
import NativeSelect from '@material-ui/core/NativeSelect';
import { List, ListItem, ListItemText, TextField } from '@material-ui/core';

class ChatRoomTest extends Component {

    constructor(props){
        super(props);
        this.state={
            localVideoSrc:null,
            remoteVideoSrc:null,
            videoEnable:true,
            audioEnable:true,
            bitrateValue:100,
            bStartEchoTestButton:false,
            hasTextRoom: false,
            hasSharedVideo: false,
            messages: []
        }

        // create a ref to store the video DOM element
        this.localVideo = React.createRef();
        this.remoteVideo=React.createRef();
        this.localVideo=React.createRef();
        this.setLocalVideoRef = element => {
            this.localVideo = element;
        };
        /*this.setRemoteVideoRef = element =>{
            this.remoteVideo=element;
        }*/

        this.server = ["ws://localhost:8188","http://localhost:8088/janus"];
        this.opaqueId = "videoroomtest-"+Janus.randomString(12);
        this.echotest = null;
        this.janus=null;
        this.bitrateTimer=null;
        this.bitrateNow=null;
        this.WidthAndHeight="";
        this.bStartEchoTest=false;
        this.reconnectTimer=null;//断线重连机制

        this.feeds = [];

        this.myusername= null;
        this.myroom= 1234; //Demo Room
        this.myid = null;
        this.mystream = null;
        // We use this other ID just to map our subscriptions to us
        this.mypvtid = null;

        this.handleStart=this.handleStart.bind(this);
        this.sendMessage=this.sendMessage.bind(this);
        this.enviarPaquete=this.enviarPaquete.bind(this);
        this.updateScroll=this.updateScroll.bind(this);

        // this.initSharedVideo=this.initSharedVideo.bind(this);

        this.sharedVideo = null;
    }

    componentDidMount() {
        this.setState({
            messages: []
        })
        // Initialize Janus
        Janus.init({
            debug: "all", 
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dependencies: Janus.useDefaultDependencies(),
            callback: function() {

            }});
    }

    componentWillUnmount(){
        window.removeEventListener('load',this.initSharedVideo);
        if(this.bitrateTimer&&this.janus){
            if(this.reconnectTimer){
                clearInterval(this.reconnectTimer);
            }
            if(this.bitrateTimer){
                clearInterval(this.bitrateTimer);
            }
            this.janus.destroy();
        }
    }

    handleStart(){
        // if(this.bStartEchoTest){
        //     clearInterval(this.bitrateTimer);
        //     this.janus.destroy();
        //     this.bitrateTimer=null;
        //     this.janus=null;
        //     this.bStartEchoTest=false;
        //     this.setState({bStartEchoTestButton:!this.state.bStartEchoTestButton});
        //     return;
        // }

        // this.tiempo = 0;
        // this.sharedVideo = document.getElementById("sharedVideo");
        
        // this.sharedVideo.addEventListener("seeked", this.enviarPaquete);
        // this.sharedVideo.addEventListener("play", this.enviarPaquete);
        // this.sharedVideo.addEventListener("pause", this.enviarPaquete);

        this.bStartEchoTest=true;
        this.setState({bStartEchoTestButton:!this.state.bStartEchoTestButton});

        if(!Janus.isWebrtcSupported()) {
            alert("No WebRTC support... ");
            return;
        }
        var that=this;
        // Create session
        this.janus = new Janus(
            {
                server: that.server,
                // No "iceServers" is provided, meaning janus.js will use a default STUN server
                // Here are some examples of how an iceServers field may look like to support TURN
                // 		iceServers: [{urls: "turn:yourturnserver.com:3478", username: "janususer", credential: "januspwd"}],
                // 		iceServers: [{urls: "turn:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
                // 		iceServers: [{urls: "turns:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
                // Should the Janus API require authentication, you can specify either the API secret or user token here too
                //		token: "mytoken",
                //	or
                //		apisecret: "serversecret",
                success: function() {
                    // Attach to echo test plugin
                    that.janus.attach(
                        {
                            plugin: "janus.plugin.textroom",
                            opaqueId: that.opaqueId,
                            success: function(pluginHandle) {
                                that.echotest = pluginHandle;
                                
                                Janus.log("Plugin attached! (" + that.echotest.getPlugin() + ", id=" + that.echotest.getId() + ")");
                                Janus.log("  -- This is a publisher/manager");

                                that.setupDataChannel();

                                
                            },
                            error: function(error) {
                                console.error("  -- Error attaching plugin...", error);
                                alert("Error attaching plugin... " + error);
                            },
                            iceState: function(state) {
                                Janus.log("ICE state changed to " + state);
                                if(state === 'completed'){
                                    if(that.reconnectTimer){
                                        clearInterval(that.reconnectTimer);
                                        that.reconnectTimer=null;
                                    }
                                }
                                if(state === 'failed'){
                                    that.reconnectTimer = setInterval(function() {
                                        that.bStartEchoTest=false;
                                        that.handleStart();
                                    }, 5000);
                                }
                            },
                            mediaState: function(medium, on) {
                                Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
                            },
                            webrtcState: function(on) {
                                Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                            },
                            slowLink: function(uplink, nacks) {
                                Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
                                    " packets on this PeerConnection (" + nacks + " NACKs/s " + (uplink ? "received" : "sent") + ")");
                            },
                            onmessage: function(msg, jsep) {
                                Janus.debug(" ::: Got a message :::", msg);
                                if(msg["error"]) {
                                    alert(msg["error"]);
                                }
                                if(jsep) {
                                    // Answer
                                    that.echotest.createAnswer(
                                        {
                                            jsep: jsep,
                                            media: { 
                                                audio: false,
                                                video: false,
                                                data: true
                                            },	// We only use datachannels
                                            success: function(jsep) {
                                                Janus.debug("Got SDP!", jsep);
                                                var body = { request: "ack" };
                                                that.echotest.send({ message: body, jsep: jsep });
                                            },
                                            error: function(error) {
                                                Janus.error("WebRTC error:", error);
                                                alert("WebRTC error... " + error.message);
                                            }
                                        });
                                }
                            },
                            ondataopen: function(data) {
                                Janus.log("The DataChannel is available!");
                                // Prompt for a display name to join the default room
                                // Prepare the username registration
                                that.registerUsername(`user-${Math.floor(1000000*Math.random())}`);
                                Janus.log("Username: " + that.myusername + "\nmyroom: "+that.myroom);

                                that.setState({
                                    hasTextRoom: true
                                });
                            },
                            ondata: function(data) {
                                Janus.debug("We got data from the DataChannel!", data);

                                let json = JSON.parse(data);

                                let what = json["textroom"];
                                let sendingUser = json["from"];

                                if(what === "message") {
                                    let receivedData = JSON.parse(json["text"]);
                                    let type = receivedData["type"];
                                    let content = receivedData["content"];

                                    if(type === "message") {
                                        let message = {
                                            sendingUser: sendingUser,
                                            content: content
                                        }
                                        // MESSAGE RECEIVED
                                        let messages = that.state.messages.map(l => Object.assign({}, l));
                                        messages.push(message);
                                        console.log(`BEFORE: ${messages}`);
                                        console.log(JSON.stringify(message));
                                        that.setState({
                                            messages: messages
                                        });
                                        that.updateScroll();
                                        console.log(`AFTER: ${that.state.messages}`);
                                        // let chat = document.getElementById("chat");
                                        // let chatMessage = document.createElement("p");
                                        // chatMessage.innerHTML = `${sendingUser}: ${content}`;
                                        // chat.appendChild(chatMessage);
                                    } else if(type === "video") {
                                        // VIDEO INFO RECEIVED
                                        let url = content["url"];
                                        let time = content["time"];
                                        let isPlaying = content["isPlaying"];
                                        let sharedVideo = document.getElementById("sharedVideo");

                                        if(url) {
                                            sharedVideo.firstChild.src = content["url"];
                                            that.setState({
                                                hasSharedVideo: true
                                            })
                                        } else {
                                            that.procesarPaqueteRecibido({
                                                time: time,
                                                isPlaying: isPlaying
                                            })
                                        }
                                    }
                                }

                                //~ $('#datarecv').val(data);
                                // var json = JSON.parse(data);
                                // var transaction = json["transaction"];
                                // if(transactions[transaction]) {
                                //     // Someone was waiting for this
                                //     transactions[transaction](json);
                                //     delete transactions[transaction];
                                //     return;
                                // }
                                // var what = json["textroom"];
                                // if(what === "message") {
                                //     // Incoming message: public or private?
                                //     var msg = json["text"];
                                //     msg = msg.replace(new RegExp('<', 'g'), '&lt');
                                //     msg = msg.replace(new RegExp('>', 'g'), '&gt');
                                //     var from = json["from"];
                                //     var dateString = getDateString(json["date"]);
                                //     var whisper = json["whisper"];
                                //     if(whisper === true) {
                                //         // Private message
                                //         $('#chatroom').append('<p style="color: purple;">[' + dateString + '] <b>[whisper from ' + participants[from] + ']</b> ' + msg);
                                //         $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
                                //     } else {
                                //         // Public message
                                //         $('#chatroom').append('<p>[' + dateString + '] <b>' + participants[from] + ':</b> ' + msg);
                                //         $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
                                //     }
                                // } else if(what === "announcement") {
                                //     // Room announcement
                                //     var msg = json["text"];
                                //     msg = msg.replace(new RegExp('<', 'g'), '&lt');
                                //     msg = msg.replace(new RegExp('>', 'g'), '&gt');
                                //     var dateString = getDateString(json["date"]);
                                //     $('#chatroom').append('<p style="color: purple;">[' + dateString + '] <i>' + msg + '</i>');
                                //     $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
                                // } else if(what === "join") {
                                //     // Somebody joined
                                //     var username = json["username"];
                                //     var display = json["display"];
                                //     participants[username] = display ? display : username;
                                //     if(username !== myid && $('#rp' + username).length === 0) {
                                //         // Add to the participants list
                                //         $('#list').append('<li id="rp' + username + '" class="list-group-item">' + participants[username] + '</li>');
                                //         $('#rp' + username).css('cursor', 'pointer').click(function() {
                                //             var username = $(this).attr('id').split("rp")[1];
                                //             sendPrivateMsg(username);
                                //         });
                                //     }
                                //     $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' joined</i></p>');
                                //     $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
                                // } else if(what === "leave") {
                                //     // Somebody left
                                //     var username = json["username"];
                                //     var when = new Date();
                                //     $('#rp' + username).remove();
                                //     $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' left</i></p>');
                                //     $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
                                //     delete participants[username];
                                // } else if(what === "kicked") {
                                //     // Somebody was kicked
                                //     var username = json["username"];
                                //     var when = new Date();
                                //     $('#rp' + username).remove();
                                //     $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' was kicked from the room</i></p>');
                                //     $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
                                //     delete participants[username];
                                //     if(username === myid) {
                                //         bootbox.alert("You have been kicked from the room", function() {
                                //             window.location.reload();
                                //         });
                                //     }
                                // } else if(what === "destroyed") {
                                //     if(json["room"] !== myroom)
                                //         return;
                                //     // Room was destroyed, goodbye!
                                //     Janus.warn("The room has been destroyed!");
                                //     bootbox.alert("The room has been destroyed", function() {
                                //         window.location.reload();
                                //     });
                                // }
                            },
                            oncleanup: function() {
                                Janus.log(" ::: Got a cleanup notification :::");
                            }
                        });
                },
                error: function(error) {
                    Janus.error(error);
                    alert(error, function() {
                        window.location.reload();
                    });
                },
                destroyed: function() {
                    window.location.reload();
                }
            });
    }

    setupDataChannel() {
        var body = { request: "setup" };
        Janus.debug("Sending message:", body);
		this.echotest.send({ message: body });
    }

    registerUsername(username) {
        let transaction = this.randomString(12);
        var register = {
            textroom: "join",
            room: this.myroom,
            username: username,
            display: username,
            transaction: transaction
        };

        this.myusername = username;
        this.echotest.data({ 
            text: JSON.stringify(register),
            error: function(reason) {
                console.error(reason);
            }
        });
    }

    sendMessage() {
        let inputBox = document.getElementById("messageBox");
        if(inputBox) {
            let inputVal = inputBox.value;
            if(!this.state.hasTextRoom)
                return;
            if(inputVal === "") {
                alert('Insert a message to send on the DataChannel');
                return;
            }

            let data = {
                content: inputVal,
                type: "message"
            }

            var message = {
                textroom: "message",
                transaction: this.randomString(12),
                room: this.myroom,
                text: JSON.stringify(data)
            };
            // Note: messages are always acknowledged by default. This means that you'll
            // always receive a confirmation back that the message has been received by the
            // server and forwarded to the recipients. If you do not want this to happen,
            // just add an ack:false property to the message above, and server won't send
            // you a response (meaning you just have to hope it succeeded).
            this.echotest.data({
                text: JSON.stringify(message),
                error: function(reason) { console.error(reason); },
                success: function() {
                    console.log("MESSAGE SENT", message);
                }
            });
            
            inputBox.value = null;
        }
    }

    randomString(len, charSet) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz,randomPoz+1);
        }
        return randomString;
    }

    ////////////////////////////////
    // Visualización colaborativa //
    ////////////////////////////////
    updateTime(t, isPlaying)	{
		this.tiempo = t;
		this.updateVideo(isPlaying);
	}

	updateVideo(isPlaying) {
        let sharedVideo = document.getElementById("sharedVideo");

        if(sharedVideo.currentTime !== this.tiempo) {
            sharedVideo.currentTime = this.tiempo;
        }
        
        if(isPlaying === sharedVideo.paused) {
            if(isPlaying) {
                sharedVideo.play().then().catch(err => console.log(err));
            } else {
                sharedVideo.pause();
            }
        }

	}

	getTime()	{
		return document.getElementById("sharedVideo").currentTime;
	}
	

	enviarPaquete()	{
		let datosVisualizacion = {
			time : this.getTime(),
			isPlaying: !document.getElementById("sharedVideo").paused
		};

		if(!this.state.hasTextRoom)
                return;

        let data = {
            content: datosVisualizacion,
            type: "video"
        }

        var message = {
            textroom: "message",
            transaction: this.randomString(12),
            room: this.myroom,
            text: JSON.stringify(data)
        };
        // Note: messages are always acknowledged by default. This means that you'll
        // always receive a confirmation back that the message has been received by the
        // server and forwarded to the recipients. If you do not want this to happen,
        // just add an ack:false property to the message above, and server won't send
        // you a response (meaning you just have to hope it succeeded).
        this.echotest.data({
            text: JSON.stringify(message),
            error: function(reason) { console.error(reason); },
            success: function() {
                console.log("MESSAGE SENT", message);
            }
        });
    }

    cambiarVideo(videoUrl) {
        let datosVideo = {
            url: videoUrl
        }

		if(!this.state.hasTextRoom)
                return;

        let data = {
            content: datosVideo,
            type: "video"
        }

        var message = {
            textroom: "message",
            transaction: this.randomString(12),
            room: this.myroom,
            text: JSON.stringify(data)
        };
        // Note: messages are always acknowledged by default. This means that you'll
        // always receive a confirmation back that the message has been received by the
        // server and forwarded to the recipients. If you do not want this to happen,
        // just add an ack:false property to the message above, and server won't send
        // you a response (meaning you just have to hope it succeeded).
        this.echotest.data({
            text: JSON.stringify(message),
            error: function(reason) { console.error(reason); },
            success: function() {
                console.log("MESSAGE SENT", message);
            }
        });
    }

	procesarPaqueteRecibido(paquete)	{
		this.updateTime(paquete.time, paquete.isPlaying);
    }

    updateScroll(){
        var element = document.getElementById("chat");
        element.scrollTop = element.scrollHeight;
    }

    render() {
        console.log("RENDER");
        console.log(this.state.messages);
        
        return (
            <div>
                {this.state.hasTextRoom ? 
                    <Fragment style={{overflow: "hidden"}}>
                        {/* <input type="text" id="messageBox" style={{width: "100%"}}></input> */}
                        <TextField id="messageBox" variant="outlined" style={{width: "13vw"}}/>
                        {/* <button onClick={this.sendMessage}>Send</button> */}
                        <Button variant="contained" onClick={this.sendMessage} color="primary">Send</Button>
                        <List id="chat" style={{overflow: 'auto',width: "13vw", height: "270px"}}>
                            {this.state.messages.map((msg) => {
                                return (
                                    <ListItem>
                                        <ListItemText primary={msg.content} secondary={msg.sendingUser}/>
                                    </ListItem>
                                );
                            })}
                        </List>
                        <video width="320" height="240" controls id="sharedVideo" 
                                onSeeked={this.enviarPaquete} 
                                onPlay={this.enviarPaquete} 
                                onPause={this.enviarPaquete}
                                style={{width: "13vw", position: 'relative', top: "-50px"}}>
                            <source src="main.mp4" type="video/mp4"/>
                        </video>

                    </Fragment>
                    
                 : 
                //  <button onClick={this.handleStart}>Start</button>
                <Button variant="contained" onClick={this.handleStart} color="primary">Start</Button>
                }
            </div>
        );
    }
}

// const styles = {
//     root: {
//         flexGrow: 1,
//         textAlign: 'center',
//     },
//     card: {
//         maxWidth: 640,
        
//     },
//     video: {
//         paddingTop: 5, // 16:9
//         width:480,
//         height:480,
//     },

//     button: {
//         paddingBottom: 5, // 16:9
//     },

//     selectEmpty: {
//         marginTop:  2,
//     },
// };

export default ChatRoomTest;
